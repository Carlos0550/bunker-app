import { Router } from "express";
import { customerController } from "@/controllers/customer.controller";
import { authenticate } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import { verifySubscription } from "@/middlewares";
import {
  createCustomerSchema,
  updateBusinessCustomerSchema,
  registerPaymentSchema,
} from "@/schemas/customer.schemas";

const router = Router();

// Todas las rutas requieren autenticación y suscripción activa
router.use(authenticate);
router.use(verifySubscription);

// IMPORTANTE: Las rutas más específicas deben ir ANTES que las rutas con parámetros

// Cuentas corrientes (DEBEN IR ANTES de /:id)
router.get("/accounts/summary", customerController.getAccountsSummary);
router.get("/accounts", customerController.getCurrentAccounts);
router.post("/accounts/:id/payment", validateBody(registerPaymentSchema), customerController.registerPayment);
router.get("/accounts/:id/payments", customerController.getAccountPayments);

// Clientes (las rutas con :id van al final)
router.post("/", validateBody(createCustomerSchema), customerController.createCustomer);
router.get("/", customerController.getCustomers);
router.get("/:id", customerController.getCustomerDetail);
router.patch("/:id", validateBody(updateBusinessCustomerSchema), customerController.updateCustomer);

export default router;
