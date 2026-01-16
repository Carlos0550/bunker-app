import { Request, Response, NextFunction } from "express";
import { businessService } from "@/services/business.service";
import { prisma } from "@/config/db";
import createHttpError from "http-errors";
class BusinessController {
  updateContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requesterId = req.user?.userId;
      if (!requesterId) {
        throw createHttpError(401, "No autorizado");
      }
      const { businessId, ...contactData } = req.body;
      if (!businessId) {
        throw createHttpError(400, "Se requiere el ID del negocio");
      }
      const business = await businessService.updateBusinessContact(
        businessId,
        requesterId,
        contactData
      );
      res.json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  };
  setPaymentResponsible = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user?.userId;
      if (!currentUserId) {
        throw createHttpError(401, "No autorizado");
      }
      const { businessId, userId } = req.body;
      if (!businessId || !userId) {
        throw createHttpError(400, "Se requiere businessId y userId");
      }
      const result = await businessService.setPaymentResponsible(
        businessId,
        userId,
        currentUserId
      );
      res.json({
        success: true,
        message: "Responsable de pagos actualizado correctamente",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
  getBusiness = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requesterId = req.user?.userId;
      if (!requesterId) {
        throw createHttpError(401, "No autorizado");
      }
      const { businessId } = req.params;
      if (!businessId) {
        throw createHttpError(400, "Se requiere el ID del negocio");
      }
      const business = await businessService.getBusiness(businessId, requesterId);
      res.json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  };

  updateBusinessData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessId, ...data } = req.body;

      if (!businessId) {
        throw createHttpError(400, "Se requiere el ID del negocio");
      }
      await businessService.updateBusinessData(businessId, data);
      res.json({
        success: true,
        message: "Datos del negocio actualizados correctamente",
      });
    }
    catch (error) {
      next(error);
    }
  };

  getMultipliers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let businessId = req.user?.businessId;
      const userId = req.user?.userId;

      if (!userId) {
        throw createHttpError(401, "No autorizado");
      }

      // If businessId is not in token, fetch from DB
      if (!businessId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { businessId: true },
        });
        businessId = user?.businessId || undefined;
      }
      
      if (!businessId) {
        return res.status(403).json({
          success: false,
          error: { message: "Usuario sin negocio asignado" },
        });
      }

      const multipliers = await businessService.getBusinessMultipliers(businessId);
      
      res.status(200).json({
        success: true,
        data: multipliers,
      });
    } catch (error) {
      next(error);
    }
  };

  updateMultipliers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let businessId = req.user?.businessId;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        throw createHttpError(401, "No autorizado");
      }

      // If businessId is not in token, fetch from DB
      if (!businessId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { businessId: true },
        });
        businessId = user?.businessId || undefined;
      }
      
      if (!businessId) {
        return res.status(403).json({
          success: false,
          error: { message: "Usuario sin negocio asignado" },
        });
      }

      // Only admin can update multipliers
      if (userRole !== 1 && userRole !== 0) {
        return res.status(403).json({
          success: false,
          error: { message: "Solo administradores pueden configurar multiplicadores" },
        });
      }

      const multipliers = await businessService.updateBusinessMultipliers(
        businessId,
        req.body.multipliers
      );
      
      res.status(200).json({
        success: true,
        data: multipliers,
      });
    } catch (error) {
      next(error);
    }
  };
}
export const businessController = new BusinessController();
