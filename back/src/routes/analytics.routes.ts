import { Router } from "express";
import { analyticsController } from "@/controllers/analytics.controller";
import { authenticate } from "@/middlewares/auth";
import { verifySubscription } from "@/middlewares";

const router = Router();

// Todas las rutas requieren autenticación y suscripción activa
router.use(authenticate);
router.use(verifySubscription);

// Dashboard
router.get("/dashboard", analyticsController.getDashboardStats);

// Resumen de ventas
router.get("/sales-summary", analyticsController.getSalesSummary);

// Productos
router.get("/top-products", analyticsController.getTopProducts);
router.get("/least-selling-products", analyticsController.getLeastSellingProducts);
router.get("/low-stock-products", analyticsController.getLowStockProducts);
router.get("/product-performance/:productId", analyticsController.getProductPerformance);

// Gráficos
router.get("/weekly-chart", analyticsController.getWeeklySalesChart);

// Ventas recientes
router.get("/recent-sales", analyticsController.getRecentSales);

export default router;
