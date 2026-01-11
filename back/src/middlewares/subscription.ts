import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { prisma } from "@/config/db";
import { PaymentStatus } from "@prisma/client";
const GRACE_PERIOD_DAYS = 3;
interface SubscriptionStatus {
  isActive: boolean;
  daysOverdue: number;
  inGracePeriod: boolean;
  nextPaymentDate: Date | null;
  isTrial: boolean;
}
export async function getBusinessSubscriptionStatus(businessId: string): Promise<SubscriptionStatus> {
  const latestPayment = await prisma.paymentHistory.findFirst({
    where: { businessId },
    orderBy: { date: "desc" },
  });
  if (!latestPayment) {
    return {
      isActive: false,
      daysOverdue: 0,
      inGracePeriod: false,
      nextPaymentDate: null,
      isTrial: false,
    };
  }
  const now = new Date();
  const nextPaymentDate = latestPayment.nextPaymentDate;
  if (!nextPaymentDate) {
    return {
      isActive: true,
      daysOverdue: 0,
      inGracePeriod: false,
      nextPaymentDate: null,
      isTrial: latestPayment.isTrial,
    };
  }
  const diffTime = now.getTime() - nextPaymentDate.getTime();
  const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (daysOverdue <= 0) {
    return {
      isActive: true,
      daysOverdue: 0,
      inGracePeriod: false,
      nextPaymentDate,
      isTrial: latestPayment.isTrial,
    };
  }
  const paymentAfterDue = await prisma.paymentHistory.findFirst({
    where: {
      businessId,
      date: { gte: nextPaymentDate },
      status: PaymentStatus.PAID,
    },
  });
  if (paymentAfterDue) {
    return {
      isActive: true,
      daysOverdue: 0,
      inGracePeriod: false,
      nextPaymentDate: paymentAfterDue.nextPaymentDate,
      isTrial: paymentAfterDue.isTrial,
    };
  }
  const inGracePeriod = daysOverdue <= GRACE_PERIOD_DAYS;
  return {
    isActive: inGracePeriod,
    daysOverdue,
    inGracePeriod,
    nextPaymentDate,
    isTrial: latestPayment.isTrial,
  };
}
export async function verifySubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role === 0) {
      return next();
    }
    const userId = req.user?.userId;
    if (!userId) {
      return next(createHttpError(401, "Usuario no autenticado"));
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true },
    });
    if (!user?.businessId) {
      return next();
    }
    const subscriptionStatus = await getBusinessSubscriptionStatus(user.businessId);
    if (!subscriptionStatus.isActive) {
      throw createHttpError(
        402,
        `Su suscripción ha expirado hace ${subscriptionStatus.daysOverdue} días. ` +
        "Por favor, realice el pago para continuar usando el sistema."
      );
    }
    if (subscriptionStatus.inGracePeriod) {
      const remainingDays = GRACE_PERIOD_DAYS - subscriptionStatus.daysOverdue;
      res.setHeader("X-Subscription-Warning", "true");
      res.setHeader("X-Subscription-Days-Remaining", remainingDays.toString());
      res.setHeader(
        "X-Subscription-Message",
        `Su pago está vencido. Tiene ${remainingDays} día(s) para regularizar su situación.`
      );
    }
    next();
  } catch (error) {
    next(error);
  }
}
export function verifySubscriptionForCriticalRoutes(req: Request, res: Response, next: NextFunction): void {
  const criticalMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (criticalMethods.includes(req.method)) {
    verifySubscription(req, res, next);
  } else {
    next();
  }
}
export async function checkBusinessAccess(businessId: string): Promise<{ hasAccess: boolean; message?: string }> {
  const status = await getBusinessSubscriptionStatus(businessId);
  if (!status.isActive) {
    return {
      hasAccess: false,
      message: `Suscripción expirada hace ${status.daysOverdue} días`,
    };
  }
  if (status.inGracePeriod) {
    const remainingDays = GRACE_PERIOD_DAYS - status.daysOverdue;
    return {
      hasAccess: true,
      message: `Período de gracia: ${remainingDays} día(s) restantes`,
    };
  }
  return { hasAccess: true };
}
