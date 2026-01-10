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
        businessPlan: {
          include: {
            planFeatures: {
              include: { feature: true },
            },
          },
        },
      },
    });

    if (!business) {
      throw createHttpError(404, "Negocio no encontrado");
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
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) {
          // Período de gracia de 7 días
          if (daysRemaining >= -7) {
            subscriptionStatus = "grace_period";
          } else {
            subscriptionStatus = "expired";
          }
        }
      }
    } else {
      // Sin pagos registrados - probablemente nuevo
      subscriptionStatus = "trial";
      daysRemaining = 14; // Período de prueba por defecto
    }

    return {
      business: {
        id: business.id,
        name: business.name,
      },
      plan: business.businessPlan ? {
        id: business.businessPlan.id,
        name: business.businessPlan.name,
        price: business.businessPlan.price,
        description: business.businessPlan.description,
        features: business.businessPlan.features,
        planFeatures: business.businessPlan.planFeatures.map(pf => ({
          feature: pf.feature.name,
          code: pf.feature.code,
          value: pf.value,
        })),
      } : null,
      subscription: {
        status: subscriptionStatus,
        daysRemaining: Math.max(0, daysRemaining),
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
      include: {
        planFeatures: {
          include: { feature: true },
        },
      },
      orderBy: { price: "asc" },
    });

    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      description: plan.description,
      features: plan.features,
      planFeatures: plan.planFeatures.map(pf => ({
        feature: pf.feature.name,
        code: pf.feature.code,
        value: pf.value,
        valueType: pf.feature.valueType,
      })),
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
