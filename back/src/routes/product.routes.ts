import { Router } from "express";
import { productController } from "@/controllers/product.controller";
import { authenticate } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import { verifySubscription } from "@/middlewares";
import { imageUploader } from "@/middlewares/upload";
import {
  createProductSchema,
  updateProductSchema,
  createProductsBulkSchema,
  updateStockSchema,
  createCategorySchema,
} from "@/schemas/product.schemas";

const router = Router();

// Todas las rutas requieren autenticación y suscripción activa
router.use(authenticate);
router.use(verifySubscription);

// Listar productos
router.get("/", productController.getProducts);

// Obtener productos eliminados (papelera)
router.get("/deleted", productController.getDeletedProducts);

// Obtener productos con stock bajo
router.get("/low-stock", productController.getLowStockProducts);

// Buscar por código de barras
router.get("/barcode/:barcode", productController.findByBarcode);

// Obtener categorías
router.get("/categories", productController.getCategories);

// Crear categoría
router.post("/categories", validateBody(createCategorySchema), productController.createCategory);

// Obtener un producto
router.get("/:id", productController.getProductById);

// Crear producto
router.post(
  "/",
  validateBody(createProductSchema),
  productController.createProduct
);

// Crear productos en lote
router.post(
  "/bulk",
  validateBody(createProductsBulkSchema),
  productController.createProductsBulk
);

// Actualizar producto
router.patch("/:id", validateBody(updateProductSchema), productController.updateProduct);

// Actualizar imagen del producto
router.patch("/:id/image", imageUploader.single("image"), productController.updateProductImage);

// Actualizar stock
router.patch("/:id/stock", validateBody(updateStockSchema), productController.updateStock);

// Soft delete (mover a papelera)
router.delete("/:id", productController.softDeleteProduct);

// Hard delete (eliminar permanentemente)
router.delete("/:id/permanent", productController.hardDeleteProduct);

// Restaurar producto
router.post("/:id/restore", productController.restoreProduct);

export default router;
