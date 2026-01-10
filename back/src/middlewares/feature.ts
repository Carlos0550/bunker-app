import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { prisma } from "@/config/db";
import { featureService, FEATURE_CODES } from "@/services/feature.service";

/**
 * Middleware factory que verifica si el negocio tiene acceso a una feature booleana
 */
export function requireFeature(featureCode: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Super admin tiene acceso a todo
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
        return next(createHttpError(403, "Usuario sin negocio asociado"));
      }

      const hasAccess = await featureService.checkBooleanFeature(user.businessId, featureCode);

      if (!hasAccess) {
        return next(
          createHttpError(
            403,
            `Esta funcionalidad no está disponible en su plan actual. Actualice su suscripción para acceder.`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory que verifica límites numéricos antes de crear recursos
 */
export function requireFeatureLimit(
  featureCode: string,
  countFunction: (businessId: string) => Promise<number>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Super admin no tiene límites
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
        return next(createHttpError(403, "Usuario sin negocio asociado"));
      }

      const currentCount = await countFunction(user.businessId);
      const result = await featureService.checkNumericFeatureLimit(
        user.businessId,
        featureCode,
        currentCount
      );

      if (!result.allowed) {
        return next(
          createHttpError(
            403,
            `Ha alcanzado el límite de ${result.limit} permitido en su plan. ` +
            `Actualmente tiene ${result.current}. Actualice su suscripción para más.`
          )
        );
      }

      // Agregar información del límite al request para uso posterior
      (req as any).featureLimit = result;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware que verifica el límite de productos antes de crear uno nuevo
 */
export const requireProductLimit = requireFeatureLimit(
  FEATURE_CODES.MAX_PRODUCTS,
  async (businessId: string) => {
    return prisma.products.count({
      where: { businessId, state: { not: "DELETED" } },
    });
  }
);

/**
 * Middleware que verifica el límite de usuarios antes de crear uno nuevo
 */
export const requireUserLimit = requireFeatureLimit(
  FEATURE_CODES.MAX_USERS,
  async (businessId: string) => {
    return prisma.user.count({
      where: { businessId, status: { not: "DELETED" } },
    });
  }
);

/**
 * Middleware que verifica el límite de ventas mensuales
 */
export const requireSalesLimit = requireFeatureLimit(
  FEATURE_CODES.MAX_SALES_PER_MONTH,
  async (businessId: string) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return prisma.sale.count({
      where: {
        businessId,
        createdAt: { gte: startOfMonth },
        status: { not: "CANCELLED" },
      },
    });
  }
);

/**
 * Middleware que requiere acceso a reportes
 */
export const requireReportsAccess = requireFeature(FEATURE_CODES.REPORTS_ACCESS);

/**
 * Middleware que requiere acceso a analíticas avanzadas
 */
export const requireAdvancedAnalytics = requireFeature(FEATURE_CODES.ADVANCED_ANALYTICS);

/**
 * Middleware que requiere acceso a exportación de datos
 */
export const requireExportAccess = requireFeature(FEATURE_CODES.EXPORT_DATA);

/**
 * Middleware que requiere acceso a API
 */
export const requireApiAccess = requireFeature(FEATURE_CODES.API_ACCESS);
