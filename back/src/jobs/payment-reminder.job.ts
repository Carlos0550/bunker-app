import { Job, Worker } from "bullmq";
import { prisma } from "@/config/db";
import { createWorker, getQueue } from "@/config/queue";
import { sendNotificationEmail } from "@/utils/email.util";
import { PaymentAttemptStatus, PaymentStatus } from "@prisma/client";
import { logger } from "@/app";

const QUEUE_NAME = "payment-reminders";
const JOB_NAME = "check-overdue-payments";
const GRACE_PERIOD_DAYS = 3;

interface PaymentReminderData {
  scheduledAt: string;
}

interface OverdueBusiness {
  businessId: string;
  businessName: string;
  daysOverdue: number;
  nextPaymentDate: Date;
  admins: { email: string; name: string }[];
  latestPaymentHistoryId: string;
}

/**
 * Obtiene los negocios con pagos vencidos
 */
async function getOverdueBusinesses(): Promise<OverdueBusiness[]> {
  const now = new Date();
  
  // Buscar negocios con pagos vencidos
  const overduePayments = await prisma.paymentHistory.findMany({
    where: {
      nextPaymentDate: { lt: now },
      status: PaymentStatus.PAID, // El último pago está pagado pero venció
    },
    include: {
      business: {
        include: {
          users: {
            where: { role: 1, status: "ACTIVE" }, // Solo admins activos
            select: { email: true, name: true },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  // Agrupar por negocio y quedarnos con el pago más reciente
  const businessMap = new Map<string, OverdueBusiness>();

  for (const payment of overduePayments) {
    if (!payment.nextPaymentDate || !payment.business) continue;

    // Verificar si ya hay un pago posterior
    const laterPayment = await prisma.paymentHistory.findFirst({
      where: {
        businessId: payment.businessId,
        date: { gt: payment.date },
        status: PaymentStatus.PAID,
      },
    });

    if (laterPayment) continue; // Ya hay un pago posterior, no está vencido

    const daysOverdue = Math.floor(
      (now.getTime() - payment.nextPaymentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Solo incluir si está en período de gracia (1-3 días)
    if (daysOverdue > 0 && daysOverdue <= GRACE_PERIOD_DAYS) {
      if (!businessMap.has(payment.businessId)) {
        businessMap.set(payment.businessId, {
          businessId: payment.businessId,
          businessName: payment.business.name,
          daysOverdue,
          nextPaymentDate: payment.nextPaymentDate,
          admins: payment.business.users.map((u) => ({
            email: u.email,
            name: u.name,
          })),
          latestPaymentHistoryId: payment.id,
        });
      }
    }
  }

  return Array.from(businessMap.values());
}

/**
 * Verifica si ya se envió notificación hoy para un negocio
 */
async function wasNotificationSentToday(paymentHistoryId: string, attemptNumber: number): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingAttempt = await prisma.paymentAttempt.findFirst({
    where: {
      paymentHistoryId,
      attemptNumber,
      attemptedAt: { gte: today },
      notificationSent: true,
    },
  });

  return !!existingAttempt;
}

/**
 * Registra un intento de cobro y notificación
 */
async function recordPaymentAttempt(
  paymentHistoryId: string,
  attemptNumber: number,
  status: PaymentAttemptStatus,
  errorMessage?: string
): Promise<void> {
  await prisma.paymentAttempt.create({
    data: {
      paymentHistoryId,
      attemptNumber,
      status,
      errorMessage,
      notificationSent: true,
    },
  });
}

/**
 * Envía notificaciones a los administradores de un negocio
 */
async function notifyBusinessAdmins(business: OverdueBusiness): Promise<void> {
  const remainingDays = GRACE_PERIOD_DAYS - business.daysOverdue;

  for (const admin of business.admins) {
    await sendNotificationEmail(
      admin.email,
      admin.name,
      `⚠️ Pago Vencido - ${business.businessName}`,
      `
        <p>Estimado/a ${admin.name},</p>
        
        <p>Le recordamos que el pago de su suscripción en <strong>${business.businessName}</strong> 
        está vencido desde el ${business.nextPaymentDate.toLocaleDateString("es-ES")}.</p>
        
        <p><strong>Días de mora:</strong> ${business.daysOverdue} día(s)</p>
        <p><strong>Días restantes de gracia:</strong> ${remainingDays} día(s)</p>
        
        <p style="color: #e53e3e; font-weight: bold;">
          ⚠️ Si no regulariza su situación en ${remainingDays} día(s), 
          su acceso al sistema será suspendido.
        </p>
        
        <p>Por favor, realice el pago lo antes posible para evitar interrupciones en su servicio.</p>
        
        <p>Si ya realizó el pago, por favor ignore este mensaje y contacte a soporte 
        si el problema persiste.</p>
        
        <p>Saludos cordiales,<br>Equipo Bunker</p>
      `
    );
  }

  logger.info({
    message: "Payment reminder sent",
    businessId: business.businessId,
    businessName: business.businessName,
    daysOverdue: business.daysOverdue,
    adminCount: business.admins.length,
  });
}

/**
 * Procesa el job de recordatorio de pagos
 */
async function processPaymentReminder(job: Job<PaymentReminderData>): Promise<void> {
  logger.info({ message: "Starting payment reminder job", jobId: job.id });

  try {
    const overdueBusinesses = await getOverdueBusinesses();

    logger.info({
      message: "Found overdue businesses",
      count: overdueBusinesses.length,
    });

    for (const business of overdueBusinesses) {
      const attemptNumber = business.daysOverdue; // Día 1 = intento 1, etc.

      // Verificar si ya se envió notificación hoy
      const alreadySent = await wasNotificationSentToday(
        business.latestPaymentHistoryId,
        attemptNumber
      );

      if (alreadySent) {
        logger.debug({
          message: "Notification already sent today",
          businessId: business.businessId,
          attemptNumber,
        });
        continue;
      }

      // Enviar notificaciones
      await notifyBusinessAdmins(business);

      // Registrar el intento
      await recordPaymentAttempt(
        business.latestPaymentHistoryId,
        attemptNumber,
        PaymentAttemptStatus.PENDING, // Pendiente porque aún no sabemos si pagarán
        undefined
      );
    }

    logger.info({
      message: "Payment reminder job completed",
      jobId: job.id,
      processedBusinesses: overdueBusinesses.length,
    });
  } catch (error) {
    logger.error({
      message: "Payment reminder job failed",
      jobId: job.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Inicializa el worker para procesar jobs de recordatorio de pago
 */
export function initPaymentReminderWorker(): Worker {
  const worker = createWorker(QUEUE_NAME, processPaymentReminder, {
    concurrency: 1, // Procesar uno a la vez
  });

  worker.on("completed", (job) => {
    logger.info({ message: "Payment reminder job completed", jobId: job.id });
  });

  worker.on("failed", (job, err) => {
    logger.error({
      message: "Payment reminder job failed",
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}

/**
 * Programa el job de recordatorio de pagos para ejecutarse diariamente
 * Se ejecuta todos los días a las 9:00 AM
 */
export async function schedulePaymentReminderJob(): Promise<void> {
  const queue = getQueue(QUEUE_NAME);

  // Eliminar jobs repetitivos anteriores
  const repeatableJobs = await queue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === JOB_NAME) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  // Programar nuevo job diario a las 9:00 AM
  await queue.add(
    JOB_NAME,
    { scheduledAt: new Date().toISOString() },
    {
      repeat: {
        pattern: "0 9 * * *", // Todos los días a las 9:00 AM
      },
      jobId: `${JOB_NAME}-daily`,
    }
  );

  logger.info({ message: "Payment reminder job scheduled for 9:00 AM daily" });
}

/**
 * Ejecuta el job de recordatorio de pagos inmediatamente (para testing)
 */
export async function runPaymentReminderNow(): Promise<void> {
  const queue = getQueue(QUEUE_NAME);
  await queue.add(JOB_NAME, { scheduledAt: new Date().toISOString() });
  logger.info({ message: "Payment reminder job queued for immediate execution" });
}
