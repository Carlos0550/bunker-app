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

  /**
   * POST /subscription/mercadopago/create-preference
   * Crear preferencia de pago en Mercado Pago
   */
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

  /**
   * POST /subscription/mercadopago/webhook
   * Webhook de Mercado Pago (no requiere autenticación)
   */
  mercadoPagoWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Mercado Pago puede enviar datos en el body o en query params (para pruebas)
      let type: string | undefined;
      let data: any;

      if (req.body && Object.keys(req.body).length > 0) {
        // Formato estándar: datos en el body
        type = req.body.type;
        data = req.body.data;
      } else if (req.query.type && req.query["data.id"]) {
        // Formato de prueba: datos en query params
        type = req.query.type as string;
        data = { id: req.query["data.id"] };
        console.log("⚠️ Webhook recibido en formato de prueba (query params). Para pruebas reales, usa el formato del body.");
      }

      if (!type || !data) {
        console.warn("Webhook recibido sin tipo o datos:", req.body, req.query);
        return res.status(200).json({ success: false, message: "Webhook sin tipo o datos válidos" });
      }
      
      // Extraer headers de firma
      const signature = req.headers["x-signature"] as string;
      const requestId = req.headers["x-request-id"] as string;

      // Log para debugging (sin datos sensibles)
      console.log("Webhook recibido:", {
        type,
        hasData: !!data,
        dataId: data?.id,
        hasSignature: !!signature,
        hasRequestId: !!requestId,
        mercadopagoTokenConfigured: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
      });

      if (type === "payment") {
        const result = await mercadoPagoService.processWebhook(
          { type, data },
          signature,
          requestId
        );
        return res.status(200).json({ success: true, data: result });
      }

      // Manejar otros tipos de webhooks (planes, suscripciones, reclamos)
      console.log("Webhook recibido pero no procesado:", type);
      res.status(200).json({ success: true, message: "Webhook recibido pero no procesado" });
    } catch (error: any) {
      console.error("Error en webhook de Mercado Pago:", {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
      });
      // Mercado Pago espera un 200 incluso si hay error
      res.status(200).json({ 
        success: false, 
        error: error.message || "Error procesando webhook" 
      });
    }
  };

  /**
   * GET /subscription/mercadopago/verify/:paymentId
   * Verificar estado de un pago
   */
  verifyMercadoPagoPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentId } = req.params;
      const paymentInfo = await mercadoPagoService.verifyPayment(paymentId);

      res.json({ success: true, data: paymentInfo });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /subscription/run-reminders
   * Ejecutar job de recordatorios manualmente (solo SuperAdmin)
   */
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
}

export const subscriptionController = new SubscriptionController();
