import { Request, Response, NextFunction } from "express";
import { customerService } from "@/services/customer.service";
import { prisma } from "@/config/db";
import createHttpError from "http-errors";
class CustomerController {
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
  createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const { creditLimit, notes, ...customerData } = req.body;
      const result = await customerService.createOrLinkCustomer(
        businessId,
        customerData,
        { creditLimit, notes }
      );
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
  getCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const search = req.query.search as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await customerService.getBusinessCustomers(
        businessId,
        search,
        page,
        limit
      );
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
  getCustomerDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const result = await customerService.getBusinessCustomerDetail(
        req.params.id,
        businessId
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
  updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const result = await customerService.updateBusinessCustomer(
        req.params.id,
        businessId,
        req.body
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
  getCurrentAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const status = req.query.status as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await customerService.getCurrentAccounts(
        businessId,
        status,
        page,
        limit
      );
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
  registerPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const { amount, paymentMethod, notes } = req.body;
      const result = await customerService.registerPayment(
        req.params.id,
        businessId,
        amount,
        paymentMethod,
        notes
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
  getAccountPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const payments = await customerService.getAccountPayments(
        req.params.id,
        businessId
      );
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  };
  getAccountsSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const summary = await customerService.getAccountsSummary(businessId);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };
  getCustomerMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const metrics = await customerService.getCustomerMetrics(
        req.params.id,
        businessId
      );
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      await customerService.deleteBusinessCustomer(req.params.id, businessId);
      res.status(200).json({
        success: true,
        message: "Cliente eliminado correctamente",
      });
    }
    catch (error) {
      next(error);
    }
  };

  updateAccountNotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const { accountId } = req.params;
      const { notes } = req.body;
      
      const account = await customerService.updateAccountNotes(accountId, businessId, notes);
      res.json({ 
        success: true, 
        data: account,
        message: "Notas actualizadas exitosamente"
      });
    } catch (error) {
      next(error);
    }
  };

  
  getSaleItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const { saleId } = req.params;
      const sale = await customerService.getSaleItems(saleId, businessId);
      res.json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  };

  addSaleItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const { saleId } = req.params;
      const result = await customerService.addSaleItem(saleId, businessId, req.body);
      res.json({ 
        success: true, 
        data: result,
        message: "Item agregado exitosamente"
      });
    } catch (error) {
      next(error);
    }
  };

  updateSaleItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const { itemId } = req.params;
      const result = await customerService.updateSaleItem(itemId, businessId, req.body);
      res.json({ 
        success: true, 
        data: result,
        message: "Item actualizado exitosamente"
      });
    } catch (error) {
      next(error);
    }
  };

  deleteSaleItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const { itemId } = req.params;
      const result = await customerService.deleteSaleItem(itemId, businessId);
      res.json({ 
        success: true, 
        data: result,
        message: "Item eliminado exitosamente"
      });
    } catch (error) {
      next(error);
    }
  };
}
export const customerController = new CustomerController();
