import { PrismaClient } from "@prisma/client";


const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


export async function testDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("✅ Conexión a la base de datos establecida");
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
    throw error;
  }
}


export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log("🔌 Conexión a la base de datos cerrada");
}


