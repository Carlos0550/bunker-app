import { Router } from "express";
import { saleController } from "@/controllers/sale.controller";
import { authenticate } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import { verifySubscription, requireSalesLimit } from "@/middlewares";
import {
  createSaleSchema,
  manualProductSchema,
  linkManualProductSchema,
  parseManualTextSchema,
} from "@/schemas/sale.schemas";

const router = Router();

// Todas las rutas requieren autenticación y suscripción activa
router.use(authenticate);
router.use(verifySubscription);

// Ventas
router.post("/", requireSalesLimit, validateBody(createSaleSchema), saleController.createSale);
router.get("/", saleController.getSales);
router.get("/:id", saleController.getSaleById);
router.post("/:id/cancel", saleController.cancelSale);

// Productos manuales
router.post("/manual-products", validateBody(manualProductSchema), saleController.createManualProduct);
router.get("/manual-products", saleController.getManualProducts);
router.post("/manual-products/:id/link", validateBody(linkManualProductSchema), saleController.linkManualProduct);
router.post("/manual-products/:id/convert", saleController.convertManualProduct);
router.post("/manual-products/:id/ignore", saleController.ignoreManualProduct);
router.post("/manual-products/parse", validateBody(parseManualTextSchema), saleController.parseManualProductText);

export default router;
