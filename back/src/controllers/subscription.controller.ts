import { Request, Response, NextFunction } from "express";
import { subscriptionService } from "@/services/subscription.service";
import { mercadoPagoService } from "@/services/mercadopago.service";
import { prisma } from "@/config/db";
import createHttpError from "http-errors";
import { runSubscriptionReminderNow } from "@/jobs/subscription-reminder.job";
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
  getCurrentPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      const data = await subscriptionService.getCurrentPlan(businessId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
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
  getAvailablePlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await subscriptionService.getAvailablePlans();
      res.json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  };
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
  createMercadoPagoPreference = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      const { planId } = req.body;
      if (!planId) {
        throw createHttpError(400, "Se requiere el ID del plan");
      }
      const plan = await prisma.businessPlan.findUnique({
        where: { id: planId },
      });
      if (!plan) {
        throw createHttpError(404, "Plan no encontrado");
      }
      if (!plan.isActive) {
        throw createHttpError(400, "El plan no está activo");
      }
      const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000";
      const successUrl = `${baseUrl}/configuracion?payment=success`;
      const failureUrl = `${baseUrl}/configuracion?payment=failure`;
      const pendingUrl = `${baseUrl}/configuracion?payment=pending`;
      const preference = await mercadoPagoService.createPaymentPreference({
        businessId,
        planId,
        amount: plan.price,
        description: plan.description || `Suscripción ${plan.name}`,
        successUrl,
        failureUrl,
        pendingUrl,
      });
      res.json({
        success: true,
        data: {
          preferenceId: preference.preferenceId,
          initPoint: preference.initPoint,
          sandboxInitPoint: preference.sandboxInitPoint,
        },
      });
    } catch (error) {
      next(error);
    }
  };
  mercadoPagoWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let type: string | undefined;
      let paymentId: string | undefined;

      // Formato 1: Body con type y data.id (webhooks v2)
      if (req.body && req.body.type && req.body.data?.id) {
        type = req.body.type;
        paymentId = req.body.data.id;
        console.log("📩 Webhook v2 recibido (body):", { type, paymentId });
      }
      // Formato 2: Body con action (payment.created, payment.updated)
      else if (req.body && req.body.action && req.body.data?.id) {
        type = req.body.action.includes("payment") ? "payment" : req.body.action;
        paymentId = req.body.data.id;
        console.log("📩 Webhook v2 recibido (action):", { action: req.body.action, paymentId });
      }
      // Formato 3: Query params con topic e id (IPN - webhooks legacy)
      else if (req.query.topic && req.query.id) {
        type = req.query.topic as string;
        paymentId = req.query.id as string;
        console.log("📩 Webhook IPN recibido (query):", { topic: type, id: paymentId });
      }
      // Formato 4: Query params con type y data.id (pruebas)
      else if (req.query.type && req.query["data.id"]) {
        type = req.query.type as string;
        paymentId = req.query["data.id"] as string;
        console.log("📩 Webhook de prueba recibido (query):", { type, paymentId });
      }

      if (!type || !paymentId) {
        console.warn("⚠️ Webhook recibido sin tipo o ID válido:", {
          body: req.body,
          query: req.query,
        });
        // Siempre responder 200 a MercadoPago para que no reintente
        return res.status(200).json({ 
          success: false, 
          message: "Webhook sin tipo o ID válido" 
        });
      }

      const signature = req.headers["x-signature"] as string;
      const requestId = req.headers["x-request-id"] as string;

      console.log("🔔 Procesando webhook:", {
        type,
        paymentId,
        hasSignature: !!signature,
        hasRequestId: !!requestId,
      });

      // Procesar pagos
      if (type === "payment") {
        const result = await mercadoPagoService.processPayment(paymentId);
        console.log("✅ Webhook procesado:", result);
        return res.status(200).json({ success: true, data: result });
      }

      console.log("ℹ️ Webhook recibido pero tipo no procesado:", type);
      res.status(200).json({ success: true, message: `Webhook tipo '${type}' recibido pero no procesado` });
    } catch (error: any) {
      console.error("❌ Error en webhook de Mercado Pago:", {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
      });
      // Siempre responder 200 para que MercadoPago no reintente infinitamente
      res.status(200).json({ 
        success: false, 
        error: error.message || "Error procesando webhook" 
      });
    }
  };
  verifyMercadoPagoPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentId } = req.params;
      const paymentInfo = await mercadoPagoService.verifyPayment(paymentId);
      res.json({ success: true, data: paymentInfo });
    } catch (error) {
      next(error);
    }
  };
  runReminders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await runSubscriptionReminderNow();
      res.json({ 
        success: true, 
        message: "Job de recordatorios encolado para ejecución inmediata" 
      });
    } catch (error) {
      next(error);
    }
  };
  registerManualPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessId, amount, months, notes } = req.body;
      if (!businessId || amount === undefined || !months) {
        throw createHttpError(400, "Faltan datos requeridos (businessId, amount, months)");
      }
      const payment = await subscriptionService.registerManualPayment(
        businessId,
        amount,
        months,
        notes
      );
      res.json({
        success: true,
        data: payment,
        message: "Pago registrado exitosamente"
      });
    } catch (error) {
      next(error);
    }
  };
}
export const subscriptionController = new SubscriptionController();
