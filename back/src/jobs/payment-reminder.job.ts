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
async function getOverdueBusinesses(): Promise<OverdueBusiness[]> {
  const now = new Date();
  const overduePayments = await prisma.paymentHistory.findMany({
    where: {
      nextPaymentDate: { lt: now },
      status: PaymentStatus.PAID, 
    },
    include: {
      business: {
        include: {
          users: {
            where: { role: 1, status: "ACTIVE" }, 
            select: { email: true, name: true },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });
  const businessMap = new Map<string, OverdueBusiness>();
  for (const payment of overduePayments) {
    if (!payment.nextPaymentDate || !payment.business) continue;
    const laterPayment = await prisma.paymentHistory.findFirst({
      where: {
        businessId: payment.businessId,
        date: { gt: payment.date },
        status: PaymentStatus.PAID,
      },
    });
    if (laterPayment) continue; 
    const daysOverdue = Math.floor(
      (now.getTime() - payment.nextPaymentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
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
async function processPaymentReminder(job: Job<PaymentReminderData>): Promise<void> {
  logger.info({ message: "Starting payment reminder job", jobId: job.id });
  try {
    const overdueBusinesses = await getOverdueBusinesses();
    logger.info({
      message: "Found overdue businesses",
      count: overdueBusinesses.length,
    });
    for (const business of overdueBusinesses) {
      const attemptNumber = business.daysOverdue; 
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
      await notifyBusinessAdmins(business);
      await recordPaymentAttempt(
        business.latestPaymentHistoryId,
        attemptNumber,
        PaymentAttemptStatus.PENDING, 
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
export function initPaymentReminderWorker(): Worker {
  const worker = createWorker(QUEUE_NAME, processPaymentReminder, {
    concurrency: 1, 
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
export async function schedulePaymentReminderJob(): Promise<void> {
  const queue = getQueue(QUEUE_NAME);
  const repeatableJobs = await queue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === JOB_NAME) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
  await queue.add(
    JOB_NAME,
    { scheduledAt: new Date().toISOString() },
    {
      repeat: {
        pattern: "0 9 * * *", 
      },
      jobId: `${JOB_NAME}-daily`,
    }
  );
  logger.info({ message: "Payment reminder job scheduled for 9:00 AM daily" });
}
export async function runPaymentReminderNow(): Promise<void> {
  const queue = getQueue(QUEUE_NAME);
  await queue.add(JOB_NAME, { scheduledAt: new Date().toISOString() });
  logger.info({ message: "Payment reminder job queued for immediate execution" });
}
