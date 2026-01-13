import { Request, Response, NextFunction } from "express";
import { businessService } from "@/services/business.service";
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
}
export const businessController = new BusinessController();
