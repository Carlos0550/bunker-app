import { Request, Response, NextFunction } from "express";
import { analyticsService } from "@/services/analytics.service";
import { prisma } from "@/config/db";
import createHttpError from "http-errors";
class AnalyticsController {
  private getBusinessId = async (req: Request): Promise<string | null> => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) {
      throw createHttpError(401, "Usuario no autenticado");
    }
    if (userRole === 0) {
      return null;
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true },
    });
    if (!user?.businessId) {
      throw createHttpError(403, "Usuario sin negocio asociado");
    }
    return user.businessId;
  };
  private getEmptyDashboardStats = () => {
    return {
      todaySales: 0,
      todayRevenue: 0,
      dailyChange: 0,
      monthlyChange: 0,
      totalProducts: 0,
      lowStockCount: 0,
      message: "Super Admin: Seleccione un negocio para ver estadísticas",
    };
  };
  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      if (!businessId) {
        return res.status(200).json({
          success: true,
          data: this.getEmptyDashboardStats(),
        });
      }
      const stats = await analyticsService.getDashboardStats(businessId);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
  getSalesSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      if (!businessId) {
        return res.status(200).json({
          success: true,
          data: { totalSales: 0, totalRevenue: 0, averageTicket: 0, transactionCount: 0 },
        });
      }
      const period = (req.query.period as any) || "today";
      const customStart = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const customEnd = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const summary = await analyticsService.getSalesSummary(businessId, period, customStart, customEnd);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };
  getTopProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      if (!businessId) {
        return res.status(200).json({ success: true, data: [] });
      }
      const limit = parseInt(req.query.limit as string) || 10;
      const period = req.query.period as any;
      const topProducts = await analyticsService.getTopProducts(businessId, limit, period);
      res.status(200).json({
        success: true,
        data: topProducts,
      });
    } catch (error) {
      next(error);
    }
  };
  getLeastSellingProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      if (!businessId) {
        return res.status(200).json({ success: true, data: [] });
      }
      const limit = parseInt(req.query.limit as string) || 10;
      const period = req.query.period as any;
      const products = await analyticsService.getLeastSellingProducts(businessId, limit, period);
      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };
  getLowStockProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      if (!businessId) {
        return res.status(200).json({ success: true, data: [] });
      }
      const products = await analyticsService.getLowStockProducts(businessId);
      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };
  getProductPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      if (!businessId) {
        return res.status(200).json({ 
          success: true, 
          data: { product: null, salesByPeriod: {}, totalSalesLast30Days: { quantity: 0, totalPrice: 0 } },
        });
      }
      const performance = await analyticsService.getProductPerformance(businessId, req.params.productId);
      res.status(200).json({
        success: true,
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  };
  getWeeklySalesChart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      if (!businessId) {
        return res.status(200).json({ success: true, data: [] });
      }
      const chartData = await analyticsService.getWeeklySalesChart(businessId);
      res.status(200).json({
        success: true,
        data: chartData,
      });
    } catch (error) {
      next(error);
    }
  };
  getRecentSales = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      if (!businessId) {
        return res.status(200).json({ success: true, data: [] });
      }
      const limit = parseInt(req.query.limit as string) || 5;
      const sales = await analyticsService.getRecentSales(businessId, limit);
      res.status(200).json({
        success: true,
        data: sales,
      });
    } catch (error) {
      next(error);
    }
  };
}
export const analyticsController = new AnalyticsController();
