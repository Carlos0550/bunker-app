import { Router } from "express";
import { subscriptionController } from "@/controllers/subscription.controller";
import { authenticate, authorize } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import { z } from "zod";

const router = Router();

// Planes disponibles (público para usuarios autenticados)
router.get("/plans", authenticate, subscriptionController.getAvailablePlans);

// Información del plan actual (requiere autenticación)
router.get("/current", authenticate, subscriptionController.getCurrentPlan);

// Historial de pagos
router.get("/payments", authenticate, subscriptionController.getPaymentHistory);

// Cambiar plan (solo admin del negocio - role 1)
router.post("/change-plan", authenticate, authorize(1), subscriptionController.changePlan);

// Mercado Pago - Crear preferencia de pago
router.post(
  "/mercadopago/create-preference",
  authenticate,
  authorize(1),
  validateBody(z.object({ planId: z.string().uuid() })),
  subscriptionController.createMercadoPagoPreference
);

// Mercado Pago - Webhook (no requiere autenticación, Mercado Pago lo llama directamente)
router.post("/mercadopago/webhook", subscriptionController.mercadoPagoWebhook);

// Mercado Pago - Verificar estado de pago
router.get("/mercadopago/verify/:paymentId", authenticate, subscriptionController.verifyMercadoPagoPayment);

// Ejecutar job de recordatorios manualmente (solo SuperAdmin)
router.post("/run-reminders", authenticate, authorize(0), subscriptionController.runReminders);

export default router;
