import { prisma } from "@/config/db";
import { Prisma } from "@prisma/client";
import createHttpError from "http-errors";
import { generateToken } from "@/config/jwt";
interface CreatePlanData {
  name: string;
  price: number;
  description?: string;
  features?: string[];
}
interface UpdatePlanData {
  name?: string;
  price?: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
}
class AdminService {
  async createPlan(data: CreatePlanData) {
    const existingActive = await prisma.businessPlan.findFirst({
      where: { isActive: true },
    });
    if (existingActive && data.name !== existingActive.name) {
      throw createHttpError(
        409,
        `Ya existe un plan activo. Solo puede haber un plan activo a la vez.`
      );
    }
    const existing = await prisma.businessPlan.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw createHttpError(
        409,
        `Ya existe un plan con el nombre '${data.name}'`
      );
    }
    const plan = await prisma.businessPlan.create({
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
        features: data.features || [],
        isActive: true,
      },
    });
    if (plan.isActive) {
      await prisma.businessPlan.updateMany({
        where: { id: { not: plan.id }, isActive: true },
        data: { isActive: false },
      });
    }
    return this.getPlanById(plan.id);
  }
  async getAllPlans(includeInactive = false) {
    return prisma.businessPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: { businesses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  async getPlanById(planId: string) {
    const plan = await prisma.businessPlan.findUnique({
      where: { id: planId },
      include: {
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
  async getActivePlan() {
    const plan = await prisma.businessPlan.findFirst({
      where: { isActive: true },
      include: {
        _count: {
          select: { businesses: true },
        },
      },
    });
    if (!plan) {
      throw createHttpError(404, "No hay un plan activo configurado");
    }
    return plan;
  }
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
        throw createHttpError(
          409,
          `Ya existe un plan con el nombre '${data.name}'`
        );
      }
    }
    if (data.isActive === true) {
      await prisma.businessPlan.updateMany({
        where: { id: { not: planId }, isActive: true },
        data: { isActive: false },
      });
    }
    return prisma.businessPlan.update({
      where: { id: planId },
      data,
      include: {
        _count: {
          select: { businesses: true },
        },
      },
    });
  }
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
    return prisma.businessPlan.delete({
      where: { id: planId },
    });
  }
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
        planName: b.businessPlanId
          ? planMap.get(b.businessPlanId) || "Sin plan"
          : "Sin plan",
        count: b._count,
      })),
      recentPayments,
    };
  }
  async impersonateUser(adminId: string, targetUserId: string) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 0) {
      throw createHttpError(
        403,
        "Solo el Super Admin puede realizar esta acción"
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw createHttpError(404, "Usuario objetivo no encontrado");
    }

    // Generate token for the target user
    const payload = {
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      businessId: targetUser.businessId || undefined,
    };

    const token = generateToken(payload);

    return {
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        businessId: targetUser.businessId,
      },
      token,
    };
  }

  async getUsersByBusinessId(businessId: string) {
    const users = await prisma.user.findMany({
      where: {
        businessId,
        status: { not: "DELETED" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { role: "asc" },
    });

    return users;
  }
}
export const adminService = new AdminService();
