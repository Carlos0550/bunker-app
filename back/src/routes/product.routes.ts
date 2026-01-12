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
router.use(authenticate);
router.use(verifySubscription);
router.get("/", productController.getProducts);
router.get("/deleted", productController.getDeletedProducts);
router.get("/low-stock", productController.getLowStockProducts);
router.get("/barcode/:barcode", productController.findByBarcode);
router.get("/categories", productController.getCategories);
router.post("/categories", validateBody(createCategorySchema), productController.createCategory);
router.patch("/categories/:id", validateBody(createCategorySchema), productController.updateCategory);
router.delete("/categories/:id", productController.deleteCategory);
router.get("/:id", productController.getProductById);
router.post(
  "/",
  validateBody(createProductSchema),
  productController.createProduct
);
router.post(
  "/bulk",
  validateBody(createProductsBulkSchema),
  productController.createProductsBulk
);
router.patch("/:id", validateBody(updateProductSchema), productController.updateProduct);
router.patch("/:id/image", imageUploader.single("image"), productController.updateProductImage);
router.patch("/:id/stock", validateBody(updateStockSchema), productController.updateStock);
router.delete("/:id", productController.softDeleteProduct);
router.delete("/:id/permanent", productController.hardDeleteProduct);
router.post("/:id/restore", productController.restoreProduct);
export default router;
