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

/**
 * Obtiene el estado de suscripción de un negocio
 */
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

  // Si no hay fecha de próximo pago, está activo indefinidamente
  if (!nextPaymentDate) {
    return {
      isActive: true,
      daysOverdue: 0,
      inGracePeriod: false,
      nextPaymentDate: null,
      isTrial: latestPayment.isTrial,
    };
  }

  // Calcular días de mora
  const diffTime = now.getTime() - nextPaymentDate.getTime();
  const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Si aún no venció
  if (daysOverdue <= 0) {
    return {
      isActive: true,
      daysOverdue: 0,
      inGracePeriod: false,
      nextPaymentDate,
      isTrial: latestPayment.isTrial,
    };
  }

  // Verificar si hay un pago exitoso después de la fecha de vencimiento
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

  // Está en mora
  const inGracePeriod = daysOverdue <= GRACE_PERIOD_DAYS;

  return {
    isActive: inGracePeriod,
    daysOverdue,
    inGracePeriod,
    nextPaymentDate,
    isTrial: latestPayment.isTrial,
  };
}

/**
 * Middleware que verifica el estado de suscripción del negocio del usuario
 * - Si está activo: permite el acceso
 * - Si está en período de gracia (1-3 días): permite acceso pero agrega header de advertencia
 * - Si expiró el período de gracia: bloquea con error 402
 */
export async function verifySubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // El super admin (role 0) no tiene restricciones de suscripción
    if (req.user?.role === 0) {
      return next();
    }

    const userId = req.user?.userId;
    if (!userId) {
      return next(createHttpError(401, "Usuario no autenticado"));
    }

    // Obtener el businessId del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true },
    });

    if (!user?.businessId) {
      // Usuario sin negocio (podría ser super admin sin negocio)
      return next();
    }

    const subscriptionStatus = await getBusinessSubscriptionStatus(user.businessId);

    // Si no está activo y no está en período de gracia
    if (!subscriptionStatus.isActive) {
      throw createHttpError(
        402,
        `Su suscripción ha expirado hace ${subscriptionStatus.daysOverdue} días. ` +
        "Por favor, realice el pago para continuar usando el sistema."
      );
    }

    // Si está en período de gracia, agregar headers de advertencia
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

/**
 * Middleware opcional que solo verifica suscripción para ciertas rutas críticas
 * Útil para permitir acceso a rutas de información pero bloquear operaciones
 */
export function verifySubscriptionForCriticalRoutes(req: Request, res: Response, next: NextFunction): void {
  const criticalMethods = ["POST", "PUT", "PATCH", "DELETE"];
  
  if (criticalMethods.includes(req.method)) {
    verifySubscription(req, res, next);
  } else {
    next();
  }
}

/**
 * Verifica si un negocio tiene acceso basado en su suscripción
 * Útil para llamar desde servicios
 */
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
