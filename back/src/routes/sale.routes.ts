import { Router } from "express";
import { saleController } from "@/controllers/sale.controller";
import { authenticate } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import { verifySubscription } from "@/middlewares";
import {
  createSaleSchema,
  manualProductSchema,
  linkManualProductSchema,
  updateManualProductSchema,
  parseManualTextSchema,
} from "@/schemas/sale.schemas";

const router = Router();

// Todas las rutas requieren autenticación y suscripción activa
router.use(authenticate);
router.use(verifySubscription);

// Productos manuales (ANTES de /:id para evitar conflicto de rutas)
router.post("/manual-products", validateBody(manualProductSchema), saleController.createManualProduct);
router.get("/manual-products", saleController.getManualProducts);
router.post("/manual-products/parse", validateBody(parseManualTextSchema), saleController.parseManualProductText);
router.put("/manual-products/:id", validateBody(updateManualProductSchema), saleController.updateManualProduct);
router.post("/manual-products/:id/link", validateBody(linkManualProductSchema), saleController.linkManualProduct);
router.post("/manual-products/:id/convert", saleController.convertManualProduct);
router.post("/manual-products/:id/ignore", saleController.ignoreManualProduct);

// Ventas
router.post("/", validateBody(createSaleSchema), saleController.createSale);
router.get("/", saleController.getSales);
router.get("/:id", saleController.getSaleById);
router.post("/:id/cancel", saleController.cancelSale);

export default router;
