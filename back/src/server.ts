import dotenv from "dotenv";
dotenv.config();
import { env } from "@/config/env";
import app, { logger } from "@/app";
import { testDatabaseConnection, disconnectDatabase } from "@/config/db";
import { testRedisConnection, disconnectRedis } from "@/config/redis";
import { initializeMinio } from "@/config/minio";
import { closeAllQueues } from "@/config/queue";
import {
  initSubscriptionReminderWorker,
  scheduleSubscriptionReminderJob,
} from "@/jobs/subscription-reminder.job";
import {
  initCleanupUploadsWorker,
  scheduleCleanupUploadsJob,
} from "@/jobs/cleanup-uploads.job";

async function startServer(): Promise<void> {
  try {
    logger.info("🚀 Iniciando servidor...");
    logger.info(`📍 Entorno: ${env.NODE_ENV}`);

    await testDatabaseConnection();
    await testRedisConnection();
    await initializeMinio();

    try {
      initSubscriptionReminderWorker();
      await scheduleSubscriptionReminderJob();
      logger.info("📅 Job de recordatorio de suscripciones inicializado");

      initCleanupUploadsWorker();
      await scheduleCleanupUploadsJob();
      logger.info("📅 Job de limpieza de uploads inicializado");
    } catch (error) {
      logger.warn(
        { err: error },
        "⚠️ No se pudo inicializar el job de recordatorios (Redis no disponible?)"
      );
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`✅ Servidor corriendo en http://localhost:${env.PORT}`);
      logger.info(`📋 Health check: http://localhost:${env.PORT}/health`);
    });

    
    server.timeout = 600000;
    server.keepAliveTimeout = 61000;
    server.headersTimeout = 62000;

    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n📴 Recibida señal ${signal}, cerrando servidor...`);
      server.close(async () => {
        logger.info("🔌 Servidor HTTP cerrado");
        try {
          await Promise.all([
            disconnectDatabase(),
            disconnectRedis(),
            closeAllQueues(),
          ]);
          logger.info("✅ Todas las conexiones cerradas correctamente");
          process.exit(0);
        } catch (error) {
          logger.error({ err: error }, "❌ Error durante el cierre");
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error("⚠️ Forzando cierre después de timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("uncaughtException", (error) => {
      logger.fatal({ err: error }, "❌ Uncaught Exception");
      process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
      logger.fatal({ err: reason }, "❌ Unhandled Rejection");
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ err: error }, "❌ Error fatal al iniciar el servidor");
    process.exit(1);
  }
}

startServer();