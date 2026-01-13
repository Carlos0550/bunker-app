import { Router } from "express";
import { businessController } from "@/controllers/business.controller";
import { authenticate, authorize } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import { verifySubscription } from "@/middlewares";
import {
  updateBusinessContactSchema,
  setPaymentResponsibleSchema,
  updateBusinessDataSchema
} from "@/schemas/business.schemas";
const router = Router();
router.use(authenticate);
router.use(verifySubscription);
router.get("/:businessId", businessController.getBusiness);
router.patch("/contact", validateBody(updateBusinessContactSchema), businessController.updateContact);
router.patch("/payment-responsible", validateBody(setPaymentResponsibleSchema), businessController.setPaymentResponsible);
router.patch("/data",authorize(1), validateBody(updateBusinessDataSchema), businessController.updateBusinessData);
export default router;
