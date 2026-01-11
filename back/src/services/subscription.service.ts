import { prisma } from "@/config/db";
import createHttpError from "http-errors";
class SubscriptionService {
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
        daysRemaining = diffDays < 0 
          ? Math.floor(diffDays)  
          : Math.ceil(diffDays);   
        if (daysRemaining < 0) {
          if (daysRemaining >= -3) {
            subscriptionStatus = "grace_period";
          } else {
            subscriptionStatus = "expired";
          }
        }
      }
    } else {
      subscriptionStatus = "trial";
      daysRemaining = 7; 
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
        daysRemaining, 
        nextPaymentDate,
        lastPaymentDate: lastPayment?.date,
        lastPaymentAmount: lastPayment?.amount,
        isTrial: lastPayment?.isTrial ?? true,
      },
    };
  }
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
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: { businessPlanId: newPlanId },
      include: { businessPlan: true },
    });
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

  async registerManualPayment(
    businessId: string,
    amount: number,
    months: number,
    notes?: string
  ) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw createHttpError(404, "Negocio no encontrado");
    }

    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + months);

    // Crear registro de pago
    const payment = await prisma.paymentHistory.create({
      data: {
        businessId,
        amount,
        status: "PAID",
        date: new Date(),
        nextPaymentDate,
        isTrial: false,
        // Podríamos guardar las notas en algún campo si existiera, 
        // pero por ahora PaymentHistory no tiene campo de notas genérico.
        // Si es necesario, agregarlo al schema.
      },
    });

    // Reactivar usuarios del negocio si estaban suspendidos por falta de pago
    // Asumimos que todos los usuarios inactivos deben ser reactivados
    await prisma.user.updateMany({
      where: {
        businessId,
        status: "INACTIVE",
      },
      data: {
        status: "ACTIVE",
      },
    });

    return payment;
  }
}
export const subscriptionService = new SubscriptionService();
