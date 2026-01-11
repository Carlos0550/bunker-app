import { prisma } from "@/config/db";
import createHttpError from "http-errors";

class SubscriptionService {
  /**
   * Obtener información del plan actual del negocio
   */
  async getCurrentPlan(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        businessPlan: true,
      },
    });

    if (!business) {
      throw createHttpError(404, "Negocio no encontrado");
    }

    if (!business.businessPlan) {
      throw createHttpError(404, "El negocio no tiene un plan asignado");
    }

    // Obtener el último pago para mostrar estado de suscripción
    const lastPayment = await prisma.paymentHistory.findFirst({
      where: { businessId },
      orderBy: { date: "desc" },
    });

    const now = new Date();
    let subscriptionStatus: "active" | "trial" | "expired" | "grace_period" = "active";
    let daysRemaining = 0;
    let nextPaymentDate = lastPayment?.nextPaymentDate;

    if (lastPayment) {
      if (lastPayment.isTrial) {
        subscriptionStatus = "trial";
      }
      
      if (nextPaymentDate) {
        const diffTime = nextPaymentDate.getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        // Usar Math.floor para fechas pasadas y Math.ceil para fechas futuras
        // Esto asegura que si nextPaymentDate ya pasó, daysRemaining será negativo
        daysRemaining = diffDays < 0 
          ? Math.floor(diffDays)  // Para fechas pasadas, redondear hacia abajo (más negativo)
          : Math.ceil(diffDays);   // Para fechas futuras, redondear hacia arriba
        
        if (daysRemaining < 0) {
          // Período de gracia de 3 días (según GRACE_PERIOD_DAYS del job)
          if (daysRemaining >= -3) {
            subscriptionStatus = "grace_period";
          } else {
            subscriptionStatus = "expired";
          }
        }
      }
    } else {
      // Sin pagos registrados - probablemente nuevo
      subscriptionStatus = "trial";
      daysRemaining = 7; // 7 días de prueba
    }

    return {
      business: {
        id: business.id,
        name: business.name,
      },
      plan: {
        id: business.businessPlan.id,
        name: business.businessPlan.name,
        price: business.businessPlan.price,
        description: business.businessPlan.description,
        features: business.businessPlan.features,
      },
      subscription: {
        status: subscriptionStatus,
        daysRemaining, // Mantener el valor negativo cuando está vencido
        nextPaymentDate,
        lastPaymentDate: lastPayment?.date,
        lastPaymentAmount: lastPayment?.amount,
        isTrial: lastPayment?.isTrial ?? true,
      },
    };
  }

  /**
   * Obtener historial de pagos del negocio
   */
  async getPaymentHistory(businessId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.paymentHistory.findMany({
        where: { businessId },
        orderBy: { date: "desc" },
        skip,
        take: limit,
        include: {
          paymentAttempts: {
            orderBy: { attemptNumber: "asc" },
          },
        },
      }),
      prisma.paymentHistory.count({ where: { businessId } }),
    ]);

    return {
      data: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        date: p.date,
        nextPaymentDate: p.nextPaymentDate,
        isTrial: p.isTrial,
        attempts: p.paymentAttempts,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener planes disponibles (públicos)
   */
  async getAvailablePlans() {
    const plans = await prisma.businessPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });

    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      description: plan.description,
      features: plan.features,
    }));
  }

  /**
   * Solicitar cambio de plan (crea una solicitud/intención)
   */
  async requestPlanChange(businessId: string, newPlanId: string, userId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { businessPlan: true },
    });

    if (!business) {
      throw createHttpError(404, "Negocio no encontrado");
    }

    const newPlan = await prisma.businessPlan.findUnique({
      where: { id: newPlanId },
    });

    if (!newPlan) {
      throw createHttpError(404, "Plan no encontrado");
    }

    if (!newPlan.isActive) {
      throw createHttpError(400, "El plan seleccionado no está disponible");
    }

    if (business.businessPlanId === newPlanId) {
      throw createHttpError(400, "Ya tienes este plan activo");
    }

    // En un sistema real, aquí se integraría con el procesador de pagos
    // Por ahora, simplemente actualizamos el plan directamente
    // y registramos un pago si es necesario

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: { businessPlanId: newPlanId },
      include: { businessPlan: true },
    });

    // Registrar el cambio de plan como un pago
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    await prisma.paymentHistory.create({
      data: {
        businessId,
        amount: newPlan.price,
        status: "PAID",
        date: new Date(),
        nextPaymentDate,
        isTrial: false,
      },
    });

    return {
      success: true,
      message: `Plan actualizado a ${newPlan.name}`,
      newPlan: {
        id: updatedBusiness.businessPlan!.id,
        name: updatedBusiness.businessPlan!.name,
        price: updatedBusiness.businessPlan!.price,
      },
    };
  }

  /**
   * Registrar un pago manual (usado por admins o webhooks de pago)
   */
  async registerPayment(
    businessId: string, 
    amount: number, 
    isTrial = false,
    durationMonths = 1
  ) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw createHttpError(404, "Negocio no encontrado");
    }

    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + durationMonths);

    const payment = await prisma.paymentHistory.create({
      data: {
        businessId,
        amount,
        status: "PAID",
        date: new Date(),
        nextPaymentDate,
        isTrial,
      },
    });

    return payment;
  }
}

export const subscriptionService = new SubscriptionService();
