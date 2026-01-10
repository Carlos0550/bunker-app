import { prisma } from "@/config/db";
import { FeatureValueType, Prisma } from "@prisma/client";
import createHttpError from "http-errors";

// Feature codes disponibles en el sistema
export const FEATURE_CODES = {
  MAX_PRODUCTS: "MAX_PRODUCTS",
  MAX_USERS: "MAX_USERS",
  MAX_SALES_PER_MONTH: "MAX_SALES_PER_MONTH",
  REPORTS_ACCESS: "REPORTS_ACCESS",
  ADVANCED_ANALYTICS: "ADVANCED_ANALYTICS",
  EXPORT_DATA: "EXPORT_DATA",
  MULTI_BRANCH: "MULTI_BRANCH",
  API_ACCESS: "API_ACCESS",
  CUSTOM_BRANDING: "CUSTOM_BRANDING",
  PRIORITY_SUPPORT: "PRIORITY_SUPPORT",
} as const;

export type FeatureCode = keyof typeof FEATURE_CODES;

interface FeatureValue {
  code: string;
  value: string;
  valueType: FeatureValueType;
  parsed: boolean | number | string;
}

class FeatureService {
  /**
   * Parsea el valor de una feature según su tipo
   */
  private parseFeatureValue(value: string, valueType: FeatureValueType): boolean | number | string {
    switch (valueType) {
      case "BOOLEAN":
        return value.toLowerCase() === "true";
      case "NUMBER":
        return parseInt(value, 10);
      case "STRING":
      default:
        return value;
    }
  }

  /**
   * Obtiene todas las features de un plan
   */
  async getPlanFeatures(planId: string): Promise<FeatureValue[]> {
    const planFeatures = await prisma.planFeature.findMany({
      where: { planId },
      include: { feature: true },
    });

    return planFeatures.map((pf) => ({
      code: pf.feature.code,
      value: pf.value,
      valueType: pf.feature.valueType,
      parsed: this.parseFeatureValue(pf.value, pf.feature.valueType),
    }));
  }

  /**
   * Obtiene el valor de una feature específica para un negocio
   */
  async getBusinessFeatureValue(
    businessId: string,
    featureCode: string
  ): Promise<boolean | number | string | null> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        businessPlan: {
          include: {
            planFeatures: {
              include: { feature: true },
              where: { feature: { code: featureCode } },
            },
          },
        },
      },
    });

    if (!business?.businessPlan) {
      return null;
    }

    const planFeature = business.businessPlan.planFeatures[0];
    if (!planFeature) {
      return null;
    }

    return this.parseFeatureValue(planFeature.value, planFeature.feature.valueType);
  }

  /**
   * Verifica si un negocio tiene acceso a una feature booleana
   */
  async checkBooleanFeature(businessId: string, featureCode: string): Promise<boolean> {
    const value = await this.getBusinessFeatureValue(businessId, featureCode);
    return value === true;
  }

  /**
   * Verifica si un negocio no ha excedido el límite de una feature numérica
   */
  async checkNumericFeatureLimit(
    businessId: string,
    featureCode: string,
    currentCount: number
  ): Promise<{ allowed: boolean; limit: number | null; current: number }> {
    const value = await this.getBusinessFeatureValue(businessId, featureCode);
    
    if (value === null) {
      // Sin límite definido
      return { allowed: true, limit: null, current: currentCount };
    }

    if (typeof value !== "number") {
      return { allowed: true, limit: null, current: currentCount };
    }

    // -1 significa ilimitado
    if (value === -1) {
      return { allowed: true, limit: null, current: currentCount };
    }

    return {
      allowed: currentCount < value,
      limit: value,
      current: currentCount,
    };
  }

  /**
   * Verifica el límite de productos para un negocio
   */
  async checkProductLimit(businessId: string): Promise<{ allowed: boolean; limit: number | null; current: number }> {
    const currentCount = await prisma.products.count({
      where: { businessId, state: { not: "DELETED" } },
    });

    return this.checkNumericFeatureLimit(businessId, FEATURE_CODES.MAX_PRODUCTS, currentCount);
  }

  /**
   * Verifica el límite de usuarios para un negocio
   */
  async checkUserLimit(businessId: string): Promise<{ allowed: boolean; limit: number | null; current: number }> {
    const currentCount = await prisma.user.count({
      where: { businessId, status: { not: "DELETED" } },
    });

    return this.checkNumericFeatureLimit(businessId, FEATURE_CODES.MAX_USERS, currentCount);
  }

  /**
   * Verifica el límite de ventas mensuales para un negocio
   */
  async checkMonthlySalesLimit(businessId: string): Promise<{ allowed: boolean; limit: number | null; current: number }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const currentCount = await prisma.sale.count({
      where: {
        businessId,
        createdAt: { gte: startOfMonth },
        status: { not: "CANCELLED" },
      },
    });

    return this.checkNumericFeatureLimit(businessId, FEATURE_CODES.MAX_SALES_PER_MONTH, currentCount);
  }

  // ==================== CRUD de Features (para Super Admin) ====================

  /**
   * Crear una nueva feature
   */
  async createFeature(data: {
    code: string;
    name: string;
    description?: string;
    valueType: FeatureValueType;
  }) {
    const existing = await prisma.feature.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw createHttpError(409, `La feature con código '${data.code}' ya existe`);
    }

    return prisma.feature.create({ data });
  }

  /**
   * Obtener todas las features
   */
  async getAllFeatures() {
    return prisma.feature.findMany({
      orderBy: { code: "asc" },
    });
  }

  /**
   * Actualizar una feature
   */
  async updateFeature(
    featureId: string,
    data: { name?: string; description?: string }
  ) {
    return prisma.feature.update({
      where: { id: featureId },
      data,
    });
  }

  /**
   * Eliminar una feature (solo si no está asignada a ningún plan)
   */
  async deleteFeature(featureId: string) {
    const assignedPlans = await prisma.planFeature.count({
      where: { featureId },
    });

    if (assignedPlans > 0) {
      throw createHttpError(
        400,
        "No se puede eliminar una feature asignada a planes. Primero elimine las asignaciones."
      );
    }

    return prisma.feature.delete({ where: { id: featureId } });
  }

  // ==================== Asignación de Features a Planes ====================

  /**
   * Asignar o actualizar una feature en un plan
   */
  async assignFeatureToPlan(planId: string, featureId: string, value: string) {
    return prisma.planFeature.upsert({
      where: {
        planId_featureId: { planId, featureId },
      },
      create: { planId, featureId, value },
      update: { value },
    });
  }

  /**
   * Remover una feature de un plan
   */
  async removeFeatureFromPlan(planId: string, featureId: string) {
    return prisma.planFeature.delete({
      where: {
        planId_featureId: { planId, featureId },
      },
    });
  }

  /**
   * Obtener features de un plan con detalles
   */
  async getPlanFeaturesDetailed(planId: string) {
    return prisma.planFeature.findMany({
      where: { planId },
      include: { feature: true },
    });
  }

  // ==================== Seed de Features por defecto ====================

  /**
   * Crea las features por defecto del sistema
   */
  async seedDefaultFeatures() {
    const defaultFeatures = [
      {
        code: FEATURE_CODES.MAX_PRODUCTS,
        name: "Límite de Productos",
        description: "Número máximo de productos que puede tener el negocio",
        valueType: FeatureValueType.NUMBER,
      },
      {
        code: FEATURE_CODES.MAX_USERS,
        name: "Límite de Usuarios",
        description: "Número máximo de usuarios/empleados del negocio",
        valueType: FeatureValueType.NUMBER,
      },
      {
        code: FEATURE_CODES.MAX_SALES_PER_MONTH,
        name: "Límite de Ventas Mensuales",
        description: "Número máximo de ventas por mes",
        valueType: FeatureValueType.NUMBER,
      },
      {
        code: FEATURE_CODES.REPORTS_ACCESS,
        name: "Acceso a Reportes",
        description: "Permite acceder a la sección de reportes",
        valueType: FeatureValueType.BOOLEAN,
      },
      {
        code: FEATURE_CODES.ADVANCED_ANALYTICS,
        name: "Analíticas Avanzadas",
        description: "Acceso a métricas y análisis avanzados",
        valueType: FeatureValueType.BOOLEAN,
      },
      {
        code: FEATURE_CODES.EXPORT_DATA,
        name: "Exportar Datos",
        description: "Permite exportar datos a Excel/CSV",
        valueType: FeatureValueType.BOOLEAN,
      },
      {
        code: FEATURE_CODES.MULTI_BRANCH,
        name: "Multi-Sucursal",
        description: "Permite gestionar múltiples sucursales",
        valueType: FeatureValueType.BOOLEAN,
      },
      {
        code: FEATURE_CODES.API_ACCESS,
        name: "Acceso API",
        description: "Permite acceso a la API para integraciones",
        valueType: FeatureValueType.BOOLEAN,
      },
      {
        code: FEATURE_CODES.CUSTOM_BRANDING,
        name: "Marca Personalizada",
        description: "Permite personalizar la marca/logo del sistema",
        valueType: FeatureValueType.BOOLEAN,
      },
      {
        code: FEATURE_CODES.PRIORITY_SUPPORT,
        name: "Soporte Prioritario",
        description: "Acceso a soporte técnico prioritario",
        valueType: FeatureValueType.BOOLEAN,
      },
    ];

    for (const feature of defaultFeatures) {
      await prisma.feature.upsert({
        where: { code: feature.code },
        create: feature,
        update: { name: feature.name, description: feature.description },
      });
    }

    return defaultFeatures.length;
  }
}

export const featureService = new FeatureService();
