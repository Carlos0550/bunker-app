import { Router } from "express";
import { adminController } from "@/controllers/admin.controller";
import { authenticate, authorize } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import {
  createPlanSchema,
  updatePlanSchema,
  assignFeatureSchema,
  createFeatureSchema,
  updateFeatureSchema,
  changeBusinessPlanSchema,
} from "@/schemas/admin.schemas";

const router = Router();

// Todas las rutas de admin requieren autenticación y rol de super admin (0)
router.use(authenticate);
router.use(authorize(0));

// ==================== PLANES ====================
router.post("/plans", validateBody(createPlanSchema), adminController.createPlan);
router.get("/plans", adminController.getAllPlans);
router.get("/plans/:id", adminController.getPlanById);
router.patch("/plans/:id", validateBody(updatePlanSchema), adminController.updatePlan);
router.delete("/plans/:id", adminController.deletePlan);

// Asignar/remover features de planes
router.post("/plans/:id/features", validateBody(assignFeatureSchema), adminController.assignFeatureToPlan);
router.delete("/plans/:id/features/:featureId", adminController.removeFeatureFromPlan);

// ==================== FEATURES ====================
router.post("/features", validateBody(createFeatureSchema), adminController.createFeature);
router.get("/features", adminController.getAllFeatures);
router.patch("/features/:id", validateBody(updateFeatureSchema), adminController.updateFeature);
router.delete("/features/:id", adminController.deleteFeature);

// ==================== NEGOCIOS ====================
router.get("/businesses", adminController.getAllBusinesses);
router.patch("/businesses/:id/plan", validateBody(changeBusinessPlanSchema), adminController.changeBusinessPlan);

// ==================== ESTADÍSTICAS ====================
router.get("/stats", adminController.getSystemStats);

export default router;
