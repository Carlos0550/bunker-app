import { PrismaClient, ProductState } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function resetStockToMinPlusOne() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🚀 Iniciando actualización de stock...");

  try {
    console.log(`📦 Encontrados productos para actualizar.`);

    // Usar una consulta raw para actualizar solo productos con stock <= 0
    const updatedCount = await prisma.$executeRaw`
      UPDATE "Products" 
      SET "stock" = COALESCE("min_stock", 0) + 1,
          "state" = 'ACTIVE'::"ProductState"
      WHERE "stock" <= 0
    `;

    console.log(
      `✨ Proceso completado. Se actualizaron ${updatedCount} productos.`,
    );
  } catch (error) {
    console.error("❌ Error durante la actualización:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

resetStockToMinPlusOne();
