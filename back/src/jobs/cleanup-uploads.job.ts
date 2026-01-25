import { Job, Worker } from "bullmq";
import { createWorker, getQueue } from "@/config/queue";
import { logger } from "@/app";
import fs from "fs/promises";
import path from "path";

const QUEUE_NAME = "cleanup-uploads";
const JOB_NAME = "cleanup-uploads-job";
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

interface CleanupUploadsData {
  scheduledAt: string;
}

async function emptyDirectory(dirPath: string): Promise<void> {
  try {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      if (file === ".gitkeep" || file === ".gitignore") continue;
      
      const fullPath = path.join(dirPath, file);
      const stat = await fs.lstat(fullPath);
      
      if (stat.isDirectory()) {
        await emptyDirectory(fullPath);
        await fs.rmdir(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }
  } catch (error) {
    logger.error({ err: error, dirPath }, "Error al vaciar directorio");
  }
}

async function processCleanupUploads(job: Job<CleanupUploadsData>): Promise<void> {
  logger.info({ message: "Starting uploads cleanup job", jobId: job.id });
  try {
    // Verificamos si existe la carpeta uploads
    try {
      await fs.access(UPLOADS_DIR);
      await emptyDirectory(UPLOADS_DIR);
      logger.info("Carpeta uploads vaciada correctamente");
    } catch (error) {
      logger.warn({ uploadsDir: UPLOADS_DIR }, "La carpeta uploads no existe o no es accesible");
    }
  } catch (error) {
    logger.error({
      message: "Uploads cleanup job failed",
      jobId: job.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export function initCleanupUploadsWorker(): Worker {
  const worker = createWorker(QUEUE_NAME, processCleanupUploads, {
    concurrency: 1,
  });

  worker.on("completed", (job) => {
    logger.info({ message: "Uploads cleanup job completed", jobId: job.id });
  });

  worker.on("failed", (job, err) => {
    logger.error({
      message: "Uploads cleanup job failed",
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}

export async function scheduleCleanupUploadsJob(): Promise<void> {
  const queue = getQueue(QUEUE_NAME);
  const repeatableJobs = await queue.getRepeatableJobs();

  for (const job of repeatableJobs) {
    if (job.name === JOB_NAME) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  // Programar para cada media noche (00:00)
  await queue.add(
    JOB_NAME,
    { scheduledAt: new Date().toISOString() },
    {
      repeat: {
        pattern: "0 0 * * *",
      },
      jobId: `${JOB_NAME}-daily`,
    }
  );

  logger.info({ message: "Uploads cleanup job scheduled for 00:00 daily" });
}
