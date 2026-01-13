import { Router } from "express";
import { customerController } from "@/controllers/customer.controller";
import { authenticate, authorize } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import { verifySubscription } from "@/middlewares";
import {
  createCustomerSchema,
  updateBusinessCustomerSchema,
  registerPaymentSchema,
} from "@/schemas/customer.schemas";
const router = Router();
router.use(authenticate);
router.use(verifySubscription);
router.get("/accounts/summary", customerController.getAccountsSummary);
router.get("/accounts", customerController.getCurrentAccounts);
router.post("/accounts/:id/payment", validateBody(registerPaymentSchema), customerController.registerPayment);
router.get("/accounts/:id/payments", customerController.getAccountPayments);
router.post("/", validateBody(createCustomerSchema), customerController.createCustomer);
router.get("/", customerController.getCustomers);
router.get("/:id/metrics", customerController.getCustomerMetrics);
router.get("/:id", customerController.getCustomerDetail);
router.patch("/:id", validateBody(updateBusinessCustomerSchema), customerController.updateCustomer);
router.delete("/:id", authorize(1), customerController.deleteCustomer);

// Account notes
router.patch("/accounts/:accountId/notes", customerController.updateAccountNotes);

// Sale items management
router.get("/sales/:saleId/items", customerController.getSaleItems);
router.post("/sales/:saleId/items", customerController.addSaleItem);
router.patch("/sales/items/:itemId", customerController.updateSaleItem);
router.delete("/sales/items/:itemId", customerController.deleteSaleItem);

export default router;
