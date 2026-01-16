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
router.use(authenticate);
router.use(authorize(0));
router.post("/plans", validateBody(createPlanSchema), adminController.createPlan);
router.get("/plans", adminController.getAllPlans);
router.get("/plans/active", adminController.getActivePlan);
router.get("/plans/:id", adminController.getPlanById);
router.patch("/plans/:id", validateBody(updatePlanSchema), adminController.updatePlan);
router.delete("/plans/:id", adminController.deletePlan);
router.get("/businesses", adminController.getAllBusinesses);
router.patch("/businesses/:id/plan", validateBody(changeBusinessPlanSchema), adminController.changeBusinessPlan);
// User Management & Impersonation
router.get("/businesses/:id/users", adminController.getUsersByBusiness);
router.post("/users/:id/impersonate", adminController.impersonateUser);

router.get("/stats", adminController.getSystemStats);
export default router;
