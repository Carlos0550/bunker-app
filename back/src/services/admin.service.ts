import { prisma } from "@/config/db";
import { FeatureValueType, Prisma } from "@prisma/client";
import createHttpError from "http-errors";
import { featureService } from "./feature.service";

interface CreatePlanData {
  name: string;
  price: number;
  description?: string;
  features?: string[]; // Descripción textual
  planFeatures?: { featureId: string; value: string }[];
}

interface UpdatePlanData {
  name?: string;
  price?: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
}

class AdminService {
  // ==================== PLANES ====================

  /**
   * Crear un nuevo plan de negocio
   */
  async createPlan(data: CreatePlanData) {
    const existing = await prisma.businessPlan.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw createHttpError(409, `Ya existe un plan con el nombre '${data.name}'`);
    }

    const plan = await prisma.businessPlan.create({
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
        features: data.features || [],
      },
    });

    // Asignar features si se proporcionaron
    if (data.planFeatures && data.planFeatures.length > 0) {
      for (const pf of data.planFeatures) {
        await prisma.planFeature.create({
          data: {
            planId: plan.id,
            featureId: pf.featureId,
            value: pf.value,
          },
        });
      }
    }

    return this.getPlanById(plan.id);
  }

  /**
   * Obtener todos los planes
   */
  async getAllPlans(includeInactive = false) {
    return prisma.businessPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        planFeatures: {
          include: { feature: true },
        },
        _count: {
          select: { businesses: true },
        },
      },
      orderBy: { price: "asc" },
    });
  }

  /**
   * Obtener un plan por ID
   */
  async getPlanById(planId: string) {
    const plan = await prisma.businessPlan.findUnique({
      where: { id: planId },
      include: {
        planFeatures: {
          include: { feature: true },
        },
        _count: {
          select: { businesses: true },
        },
      },
    });

    if (!plan) {
      throw createHttpError(404, "Plan no encontrado");
    }

    return plan;
  }

  /**
   * Actualizar un plan
   */
  async updatePlan(planId: string, data: UpdatePlanData) {
    const plan = await prisma.businessPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw createHttpError(404, "Plan no encontrado");
    }

    if (data.name && data.name !== plan.name) {
      const existing = await prisma.businessPlan.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        throw createHttpError(409, `Ya existe un plan con el nombre '${data.name}'`);
      }
    }

    return prisma.businessPlan.update({
      where: { id: planId },
      data,
      include: {
        planFeatures: {
          include: { feature: true },
        },
      },
    });
  }

  /**
   * Eliminar un plan (solo si no tiene negocios asociados)
   */
  async deletePlan(planId: string) {
    const plan = await prisma.businessPlan.findUnique({
      where: { id: planId },
      include: {
        _count: { select: { businesses: true } },
      },
    });

    if (!plan) {
      throw createHttpError(404, "Plan no encontrado");
    }

    if (plan._count.businesses > 0) {
      throw createHttpError(
        400,
        `No se puede eliminar el plan porque tiene ${plan._count.businesses} negocio(s) asociado(s). ` +
        "Primero migre los negocios a otro plan."
      );
    }

    // Eliminar features asociadas primero
    await prisma.planFeature.deleteMany({
      where: { planId },
    });

    return prisma.businessPlan.delete({
      where: { id: planId },
    });
  }

  /**
   * Asignar una feature a un plan
   */
  async assignFeatureToPlan(planId: string, featureId: string, value: string) {
    const plan = await prisma.businessPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw createHttpError(404, "Plan no encontrado");
    }

    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) {
      throw createHttpError(404, "Feature no encontrada");
    }

    return prisma.planFeature.upsert({
      where: {
        planId_featureId: { planId, featureId },
      },
      create: { planId, featureId, value },
      update: { value },
      include: { feature: true },
    });
  }

  /**
   * Remover una feature de un plan
   */
  async removeFeatureFromPlan(planId: string, featureId: string) {
    const planFeature = await prisma.planFeature.findUnique({
      where: {
        planId_featureId: { planId, featureId },
      },
    });

    if (!planFeature) {
      throw createHttpError(404, "La feature no está asignada a este plan");
    }

    return prisma.planFeature.delete({
      where: {
        planId_featureId: { planId, featureId },
      },
    });
  }

  // ==================== FEATURES ====================

  /**
   * Crear una nueva feature
   */
  async createFeature(data: {
    code: string;
    name: string;
    description?: string;
    valueType: FeatureValueType;
  }) {
    return featureService.createFeature(data);
  }

  /**
   * Obtener todas las features
   */
  async getAllFeatures() {
    return featureService.getAllFeatures();
  }

  /**
   * Actualizar una feature
   */
  async updateFeature(featureId: string, data: { name?: string; description?: string }) {
    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) {
      throw createHttpError(404, "Feature no encontrada");
    }

    return featureService.updateFeature(featureId, data);
  }

  /**
   * Eliminar una feature
   */
  async deleteFeature(featureId: string) {
    return featureService.deleteFeature(featureId);
  }

  // ==================== NEGOCIOS ====================

  /**
   * Obtener todos los negocios con información de suscripción
   */
  async getAllBusinesses(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.BusinessWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { contact_email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: limit,
        include: {
          businessPlan: true,
          _count: {
            select: { users: true, products: true, sales: true },
          },
          paymentHistory: {
            orderBy: { date: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.business.count({ where }),
    ]);

    return {
      data: businesses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cambiar el plan de un negocio
   */
  async changeBusinessPlan(businessId: string, newPlanId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
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
      throw createHttpError(400, "El plan seleccionado no está activo");
    }

    return prisma.business.update({
      where: { id: businessId },
      data: { businessPlanId: newPlanId },
      include: { businessPlan: true },
    });
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtener estadísticas generales del sistema
   */
  async getSystemStats() {
    const [
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      totalProducts,
      totalSales,
      totalRevenue,
      businessesByPlan,
      recentPayments,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({
        where: {
          users: { some: { status: "ACTIVE" } },
        },
      }),
      prisma.user.count({ where: { role: { not: 0 } } }),
      prisma.products.count({ where: { state: { not: "DELETED" } } }),
      prisma.sale.count({ where: { status: "COMPLETED" } }),
      prisma.sale.aggregate({
        where: { status: "COMPLETED" },
        _sum: { total: true },
      }),
      prisma.business.groupBy({
        by: ["businessPlanId"],
        _count: true,
      }),
      prisma.paymentHistory.findMany({
        orderBy: { date: "desc" },
        take: 10,
        include: { business: { select: { name: true } } },
      }),
    ]);

    // Obtener nombres de planes para el agrupamiento
    const planIds = businessesByPlan
      .map((b) => b.businessPlanId)
      .filter((id): id is string => id !== null);
    
    const plans = await prisma.businessPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    });

    const planMap = new Map(plans.map((p) => [p.id, p.name]));

    return {
      totals: {
        businesses: totalBusinesses,
        activeBusinesses,
        users: totalUsers,
        products: totalProducts,
        sales: totalSales,
        revenue: totalRevenue._sum.total || 0,
      },
      businessesByPlan: businessesByPlan.map((b) => ({
        planId: b.businessPlanId,
        planName: b.businessPlanId ? planMap.get(b.businessPlanId) || "Sin plan" : "Sin plan",
        count: b._count,
      })),
      recentPayments,
    };
  }
}

export const adminService = new AdminService();
