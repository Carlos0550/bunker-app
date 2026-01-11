import { Request, Response, NextFunction } from "express";
import { adminService } from "@/services/admin.service";

class AdminController {
  // ==================== PLANES ====================

  async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await adminService.createPlan(req.body);
      res.status(201).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const plans = await adminService.getAllPlans(includeInactive);
      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPlanById(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await adminService.getPlanById(req.params.id);
      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await adminService.updatePlan(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePlan(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.deletePlan(req.params.id);
      res.status(200).json({
        success: true,
        message: "Plan eliminado correctamente",
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await adminService.getActivePlan();
      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== NEGOCIOS ====================

  async getAllBusinesses(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;

      const result = await adminService.getAllBusinesses(page, limit, search);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async changeBusinessPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.body;
      const business = await adminService.changeBusinessPlan(req.params.id, planId);
      res.status(200).json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ESTADÍSTICAS ====================

  async getSystemStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getSystemStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
