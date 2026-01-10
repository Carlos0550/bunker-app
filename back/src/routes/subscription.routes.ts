import { Router } from "express";
import { subscriptionController } from "@/controllers/subscription.controller";
import { authenticate, authorize } from "@/middlewares/auth";

const router = Router();

// Planes disponibles (público para usuarios autenticados)
router.get("/plans", authenticate, subscriptionController.getAvailablePlans);

// Información del plan actual (requiere autenticación)
router.get("/current", authenticate, subscriptionController.getCurrentPlan);

// Historial de pagos
router.get("/payments", authenticate, subscriptionController.getPaymentHistory);

// Cambiar plan (solo admin del negocio - role 1)
router.post("/change-plan", authenticate, authorize(1), subscriptionController.changePlan);

export default router;
