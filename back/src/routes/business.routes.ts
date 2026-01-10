import businessController from "@/controllers/business.controller";
import { authenticate } from "@/middlewares";
import { Router } from "express";

const router = Router();

router.get("/", authenticate, businessController.getBusinessData);

export default router;