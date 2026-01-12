import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pino from "pino";
import createHttpError, { HttpError } from "http-errors";
import userRouter from "@/routes/user.routes";
import businessRouter from "@/routes/business.routes";
import adminRouter from "@/routes/admin.routes";
import productRouter from "@/routes/product.routes";
import saleRouter from "@/routes/sale.routes";
import analyticsRouter from "@/routes/analytics.routes";
import customerRouter from "@/routes/customer.routes";
import subscriptionRouter from "@/routes/subscription.routes";
import importRouter from "@/routes/import.routes";
export const logger = pino({
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});
const app: Application = express();
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production",
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",") || []
        : "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
app.use("/api", userRouter);
app.use("/api/business", businessRouter);
app.use("/api/admin", adminRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/customers", customerRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/import", importRouter);
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(createHttpError(404, "Ruta no encontrada"));
});
app.use((err: Error | HttpError, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = "status" in err ? err.status : 500;
  const isProduction = process.env.NODE_ENV === "production";
  if (statusCode >= 500) {
    logger.error({
      err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn({
      message: err.message,
      statusCode,
    });
  }
  res.status(statusCode).json({
    success: false,
    error: {
      message:
        isProduction && statusCode >= 500
          ? "Error interno del servidor"
          : err.message,
      statusCode,
      ...(!isProduction && err.stack && { stack: err.stack }),
    },
  });
});
export default app;
