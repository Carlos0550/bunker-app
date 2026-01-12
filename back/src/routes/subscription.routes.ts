import { Router } from "express";
import { subscriptionController } from "@/controllers/subscription.controller";
import { authenticate, authorize } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import { z } from "zod";
const router = Router();
router.get("/plans", authenticate, subscriptionController.getAvailablePlans);
router.get("/current", authenticate, subscriptionController.getCurrentPlan);
router.get("/payments", authenticate, subscriptionController.getPaymentHistory);
router.post("/change-plan", authenticate, authorize(1), subscriptionController.changePlan);
router.post(
  "/mercadopago/create-preference",
  authenticate,
  authorize(1),
  validateBody(z.object({ planId: z.string().uuid() })),
  subscriptionController.createMercadoPagoPreference
);
router.post("/mercadopago/webhook", subscriptionController.mercadoPagoWebhook);
router.get("/mercadopago/verify/:paymentId", authenticate, subscriptionController.verifyMercadoPagoPayment);
router.post("/run-reminders", authenticate, authorize(0), subscriptionController.runReminders);
router.post(
  "/manual-payment",
  authenticate,
  authorize(0),
  validateBody(z.object({
    businessId: z.string().uuid(),
    amount: z.number().min(0),
    months: z.number().int().positive(),
    notes: z.string().optional(),
  })),
  subscriptionController.registerManualPayment
);
export default router;
