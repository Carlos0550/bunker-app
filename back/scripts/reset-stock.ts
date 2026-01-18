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
    const products = await prisma.products.findMany({
      select: {
        id: true,
        name: true,
        min_stock: true,
      },
    });

    console.log(`📦 Encontrados ${products.length} productos.`);

    let updatedCount = 0;

    for (const product of products) {
      const newStock = (product.min_stock || 0) + 1;

      await prisma.products.update({
        where: { id: product.id },
        data: {
          stock: newStock,
          state: ProductState.ACTIVE,
        },
      });

      updatedCount++;
      if (updatedCount % 100 === 0) {
        console.log(`✅ Actualizados ${updatedCount} productos...`);
      }
    }

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
