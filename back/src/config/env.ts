import { z } from "zod/v4";
import dotenv from "dotenv";


dotenv.config();

const envSchema = z.object({
  
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.string().transform(Number),

  
  DATABASE_URL: z.string().url(),

  
  REDIS_URL: z.string(),

  
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string(),

  
  CRYPTO_SECRET: z.string().length(32, "CRYPTO_SECRET debe tener exactamente 32 caracteres"),

  
  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.string().transform(Number),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.string(),
  MINIO_USE_SSL: z.string().transform((v) => v === "true"),

  
  WASENDER_API_KEY: z.string().optional(),
  WASENDER_API_URL: z.string().optional(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("❌ Error en las variables de entorno:");
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;


if (env.NODE_ENV === "production") {
  if (!env.WASENDER_API_KEY || !env.WASENDER_API_URL) {
    console.error("❌ En producción, WASENDER_API_KEY y WASENDER_API_URL son requeridos");
    process.exit(1);
  }
}

export type Env = typeof env;


