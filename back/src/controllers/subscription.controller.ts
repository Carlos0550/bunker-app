import { Request, Response, NextFunction } from "express";
import { subscriptionService } from "@/services/subscription.service";
import { prisma } from "@/config/db";
import createHttpError from "http-errors";

class SubscriptionController {
  private getBusinessId = async (req: Request): Promise<string> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw createHttpError(401, "No autorizado");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true },
    });

    if (!user?.businessId) {
      throw createHttpError(400, "Usuario no tiene un negocio asociado");
    }

    return user.businessId;
  };

  /**
   * GET /subscription/current
   * Obtener información del plan actual
   */
  getCurrentPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      const data = await subscriptionService.getCurrentPlan(businessId);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /subscription/payments
   * Obtener historial de pagos
   */
  getPaymentHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const data = await subscriptionService.getPaymentHistory(businessId, page, limit);

      res.json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /subscription/plans
   * Obtener planes disponibles (público)
   */
  getAvailablePlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await subscriptionService.getAvailablePlans();

      res.json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /subscription/change-plan
   * Solicitar cambio de plan
   */
  changePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      const userId = req.user!.userId;
      const { planId } = req.body;

      if (!planId) {
        throw createHttpError(400, "Se requiere el ID del plan");
      }

      const result = await subscriptionService.requestPlanChange(businessId, planId, userId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}

export const subscriptionController = new SubscriptionController();
