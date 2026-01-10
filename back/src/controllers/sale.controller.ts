import { Request, Response, NextFunction } from "express";
import { saleService } from "@/services/sale.service";
import { prisma } from "@/config/db";
import createHttpError from "http-errors";

class SaleController {
  private getBusinessId = async (userId: string): Promise<string> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true },
    });

    if (!user?.businessId) {
      throw createHttpError(403, "Usuario sin negocio asociado");
    }

    return user.businessId;
  };

  createSale = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");

      const businessId = await this.getBusinessId(userId);
      const sale = await saleService.createSale(businessId, userId, req.body);

      res.status(201).json({
        success: true,
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  };

  getSales = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");

      const businessId = await this.getBusinessId(userId);

      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        isCredit: req.query.isCredit === "true" ? true : req.query.isCredit === "false" ? false : undefined,
        paymentMethod: req.query.paymentMethod as any,
      };

      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      };

      const result = await saleService.getSales(businessId, filters, pagination);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getSaleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");

      const businessId = await this.getBusinessId(userId);
      const sale = await saleService.getSaleById(req.params.id, businessId);

      res.status(200).json({
        success: true,
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  };

  cancelSale = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");

      const businessId = await this.getBusinessId(userId);
      const result = await saleService.cancelSale(req.params.id, businessId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==================== PRODUCTOS MANUALES ====================

  createManualProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");

      const businessId = await this.getBusinessId(userId);
      const result = await saleService.createManualProduct(businessId, req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getManualProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");

      const businessId = await this.getBusinessId(userId);
      const status = req.query.status as any;
      const products = await saleService.getManualProducts(businessId, status);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };

  linkManualProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");

      const businessId = await this.getBusinessId(userId);
      const { productId } = req.body;
      const result = await saleService.linkManualProduct(req.params.id, productId, businessId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  convertManualProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");

      const businessId = await this.getBusinessId(userId);
      const product = await saleService.convertManualProduct(req.params.id, businessId, req.body);

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  ignoreManualProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");

      const businessId = await this.getBusinessId(userId);
      const result = await saleService.ignoreManualProduct(req.params.id, businessId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  updateManualProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");

      const businessId = await this.getBusinessId(userId);
      const { name, quantity, price, status } = req.body;

      const updated = await saleService.updateManualProduct(req.params.id, businessId, {
        name,
        quantity,
        price,
        status,
      });

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  parseManualProductText = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text } = req.body;
      const parsed = saleService.parseManualProductText(text);

      if (!parsed) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Formato inválido. Use: CANTIDAD NOMBRE PRECIO (ej: 2 coca cola 2500)",
          },
        });
      }

      res.status(200).json({
        success: true,
        data: parsed,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const saleController = new SaleController();
