import { Router } from "express";
import { adminController } from "@/controllers/admin.controller";
import { authenticate, authorize } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import {
  createPlanSchema,
  updatePlanSchema,
  changeBusinessPlanSchema,
} from "@/schemas/admin.schemas";

const router = Router();

// Todas las rutas de admin requieren autenticación y rol de super admin (0)
router.use(authenticate);
router.use(authorize(0));

// ==================== PLANES ====================
router.post("/plans", validateBody(createPlanSchema), adminController.createPlan);
router.get("/plans", adminController.getAllPlans);
router.get("/plans/active", adminController.getActivePlan);
router.get("/plans/:id", adminController.getPlanById);
router.patch("/plans/:id", validateBody(updatePlanSchema), adminController.updatePlan);
router.delete("/plans/:id", adminController.deletePlan);

// ==================== NEGOCIOS ====================
router.get("/businesses", adminController.getAllBusinesses);
router.patch("/businesses/:id/plan", validateBody(changeBusinessPlanSchema), adminController.changeBusinessPlan);

// ==================== ESTADÍSTICAS ====================
router.get("/stats", adminController.getSystemStats);

export default router;
