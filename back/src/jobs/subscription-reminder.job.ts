import { Job, Worker } from "bullmq";
import { prisma } from "@/config/db";
import { createWorker, getQueue } from "@/config/queue";
import { sendCustomEmail } from "@/utils/email.util";
import { PaymentAttemptStatus, PaymentStatus } from "@prisma/client";
import { logger } from "@/app";
import { emailService } from "@/services/email.service";
const QUEUE_NAME = "subscription-reminders";
const JOB_NAME = "check-subscriptions";
const DAYS_BEFORE_EXPIRY = [7, 3, 1]; 
const GRACE_PERIOD_DAYS = 3; 
interface SubscriptionReminderData {
  scheduledAt: string;
}
interface BusinessSubscription {
  businessId: string;
  businessName: string;
  adminEmail: string;
  adminName: string;
  nextPaymentDate: Date;
  daysUntilExpiry: number; 
  planName: string;
  planPrice: number;
  latestPaymentHistoryId: string;
  isTrial: boolean;
}
async function getSubscriptionsToNotify(): Promise<BusinessSubscription[]> {
  const now = new Date();
  const subscriptions: BusinessSubscription[] = [];
  const businesses = await prisma.business.findMany({
    include: {
      businessPlan: true,
      paymentResponsibleUser: {
        select: { email: true, name: true },
      },
      users: {
        where: { role: 1, status: "ACTIVE" }, 
        select: { email: true, name: true },
        take: 1,
      },
      paymentHistory: {
        where: { status: PaymentStatus.PAID },
        orderBy: { date: "desc" },
        take: 1,
      },
    },
  });
  for (const business of businesses) {
    const lastPayment = business.paymentHistory[0];
    const admin = business.paymentResponsibleUser || business.users[0];
    if (!lastPayment?.nextPaymentDate || !admin) continue;
    const nextPaymentDate = new Date(lastPayment.nextPaymentDate);
    const diffTime = nextPaymentDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const daysUntilExpiry = diffDays < 0 
      ? Math.floor(diffDays)  
      : Math.ceil(diffDays);   
    if (process.env.NODE_ENV === "development") {
      logger.debug({
        message: "Checking subscription",
        businessId: business.id,
        businessName: business.name,
        nextPaymentDate: nextPaymentDate.toISOString(),
        now: now.toISOString(),
        diffDays: diffDays.toFixed(2),
        daysUntilExpiry,
        isVencido: daysUntilExpiry < 0,
      });
    }
    const shouldNotifyBefore = DAYS_BEFORE_EXPIRY.includes(daysUntilExpiry);
    const isInGracePeriod = daysUntilExpiry < 0 && daysUntilExpiry >= -GRACE_PERIOD_DAYS;
    if (shouldNotifyBefore || isInGracePeriod) {
      subscriptions.push({
        businessId: business.id,
        businessName: business.name,
        adminEmail: admin.email,
        adminName: admin.name,
        nextPaymentDate,
        daysUntilExpiry,
        planName: business.businessPlan.name,
        planPrice: business.businessPlan.price,
        latestPaymentHistoryId: lastPayment.id,
        isTrial: lastPayment.isTrial,
      });
    }
  }
  return subscriptions;
}
async function wasNotificationSentToday(paymentHistoryId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingAttempt = await prisma.paymentAttempt.findFirst({
    where: {
      paymentHistoryId,
      attemptedAt: { gte: today },
      notificationSent: true,
    },
  });
  return !!existingAttempt;
}
async function recordNotification(
  paymentHistoryId: string,
  daysUntilExpiry: number
): Promise<void> {
  const attemptNumber = daysUntilExpiry >= 0 ? -daysUntilExpiry : Math.abs(daysUntilExpiry) + 100;
  await prisma.paymentAttempt.create({
    data: {
      paymentHistoryId,
      attemptNumber,
      status: PaymentAttemptStatus.PENDING,
      notificationSent: true,
    },
  });
}
function getPaymentLink(businessId: string): string {
  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000";
  return `${baseUrl}/configuracion`;
}
async function sendExpiryWarning(subscription: BusinessSubscription): Promise<void> {
  const paymentLink = getPaymentLink(subscription.businessId);
  const formattedDate = subscription.nextPaymentDate.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedPrice = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(subscription.planPrice);
  const subject = subscription.isTrial
    ? `⏰ Tu prueba gratuita termina en ${subscription.daysUntilExpiry} día(s) - ${subscription.businessName}`
    : `⏰ Tu suscripción vence en ${subscription.daysUntilExpiry} día(s) - ${subscription.businessName}`;
  const trialBanner = subscription.isTrial
    ? `<div class="trial-banner">
        <strong>🎁 ¡Tu período de prueba está por terminar!</strong>
        Suscríbete ahora para seguir disfrutando de todas las funcionalidades.
      </div>`
    : "";
  await emailService.sendEmailWithTemplate({
    to: subscription.adminEmail,
    subject,
    templateName: "subscription-expiry-warning",
    data: {
      email: subscription.adminEmail,
      title: subject,
      adminName: subscription.adminName,
      businessName: subscription.businessName,
      expiryDate: formattedDate,
      planName: subscription.planName,
      planPrice: formattedPrice,
      daysUntilExpiry: subscription.daysUntilExpiry.toString(),
      paymentLink,
      trialBanner,
    },
  });
  logger.info({
    message: "Expiry warning sent",
    businessId: subscription.businessId,
    daysUntilExpiry: subscription.daysUntilExpiry,
    email: subscription.adminEmail,
  });
}
async function sendOverdueWarning(subscription: BusinessSubscription): Promise<void> {
  const paymentLink = getPaymentLink(subscription.businessId);
  const daysOverdue = Math.abs(subscription.daysUntilExpiry);
  const remainingGraceDays = Math.max(0, GRACE_PERIOD_DAYS - daysOverdue); 
  const formattedPrice = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(subscription.planPrice);
  let gracePeriodMessage: string;
  if (remainingGraceDays === 0) {
    gracePeriodMessage = "Este es tu último día de gracia. Tu acceso será suspendido mañana si no realizas el pago.";
  } else if (remainingGraceDays === 1) {
    gracePeriodMessage = `Te queda solo 1 día para regularizar tu situación antes de que tu acceso sea suspendido.`;
  } else {
    gracePeriodMessage = `Te quedan ${remainingGraceDays} día(s) para regularizar tu situación antes de que tu acceso sea suspendido.`;
  }
  const subject = `⚠️ URGENTE: Tu suscripción está vencida - ${subscription.businessName}`;
  await emailService.sendEmailWithTemplate({
    to: subscription.adminEmail,
    subject,
    templateName: "subscription-overdue-warning",
    data: {
      email: subscription.adminEmail,
      title: subject,
      adminName: subscription.adminName,
      businessName: subscription.businessName,
      daysOverdue: daysOverdue.toString(),
      remainingGraceDays: remainingGraceDays.toString(),
      gracePeriodMessage, 
      planName: subscription.planName,
      planPrice: formattedPrice,
      paymentLink,
    },
  });
  logger.info({
    message: "Overdue warning sent",
    businessId: subscription.businessId,
    daysOverdue,
    remainingGraceDays,
    email: subscription.adminEmail,
  });
}
async function suspendExpiredBusinesses(): Promise<void> {
  const now = new Date();
  const gracePeriodAgo = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const businesses = await prisma.business.findMany({
    include: {
      paymentHistory: {
        where: { status: PaymentStatus.PAID },
        orderBy: { date: "desc" },
        take: 1,
      },
      paymentResponsibleUser: {
        select: { email: true, name: true },
      },
      users: {
        where: { role: 1, status: "ACTIVE" },
        select: { id: true, email: true, name: true },
      },
    },
  });
  for (const business of businesses) {
    const lastPayment = business.paymentHistory[0];
    if (!lastPayment?.nextPaymentDate) continue;
    if (new Date(lastPayment.nextPaymentDate) < gracePeriodAgo) {
      await prisma.user.updateMany({
        where: {
          businessId: business.id,
          status: "ACTIVE",
        },
        data: {
          status: "INACTIVE",
        },
      });
      const recipient = business.paymentResponsibleUser || business.users[0];
      if (recipient) {
        const subject = `🔒 Acceso desactivado - ${business.name}`;
        await emailService.sendEmailWithTemplate({
          to: recipient.email,
          subject,
          templateName: "subscription-suspended",
          data: {
            email: recipient.email,
            title: subject,
            adminName: recipient.name,
            businessName: business.name,
            paymentLink: getPaymentLink(business.id),
          },
        });
      }
      logger.warn({
        message: "Business deactivated due to expired subscription",
        businessId: business.id,
        businessName: business.name,
      });
    }
  }
}
async function processSubscriptionReminder(job: Job<SubscriptionReminderData>): Promise<void> {
  logger.info({ message: "Starting subscription reminder job", jobId: job.id });
  try {
    const subscriptions = await getSubscriptionsToNotify();
    logger.info({
      message: "Found subscriptions to process",
      count: subscriptions.length,
    });
    for (const subscription of subscriptions) {
      const alreadySent = await wasNotificationSentToday(subscription.latestPaymentHistoryId);
      if (alreadySent) {
        logger.debug({
          message: "Notification already sent today",
          businessId: subscription.businessId,
        });
        continue;
      }
      if (subscription.daysUntilExpiry > 0) {
        await sendExpiryWarning(subscription);
      } else {
        await sendOverdueWarning(subscription);
      }
      await recordNotification(subscription.latestPaymentHistoryId, subscription.daysUntilExpiry);
    }
    await suspendExpiredBusinesses();
    logger.info({
      message: "Subscription reminder job completed",
      jobId: job.id,
      processedSubscriptions: subscriptions.length,
    });
  } catch (error) {
    logger.error({
      message: "Subscription reminder job failed",
      jobId: job.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
export function initSubscriptionReminderWorker(): Worker {
  const worker = createWorker(QUEUE_NAME, processSubscriptionReminder, {
    concurrency: 1,
  });
  worker.on("completed", (job) => {
    logger.info({ message: "Subscription reminder job completed", jobId: job.id });
  });
  worker.on("failed", (job, err) => {
    logger.error({
      message: "Subscription reminder job failed",
      jobId: job?.id,
      error: err.message,
    });
  });
  return worker;
}
export async function scheduleSubscriptionReminderJob(): Promise<void> {
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
        pattern: "58 0 * * *", 
      },
      jobId: `${JOB_NAME}-daily`,
    }
  );
  logger.info({ message: "Subscription reminder job scheduled for 00:31 daily" });
}
export async function runSubscriptionReminderNow(): Promise<void> {
  const queue = getQueue(QUEUE_NAME);
  await queue.add(JOB_NAME, { scheduledAt: new Date().toISOString() });
  logger.info({ message: "Subscription reminder job queued for immediate execution" });
}
