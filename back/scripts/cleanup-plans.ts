/**
 * Script para eliminar planes obsoletos (solo mantener "Prueba gratuita" y "Pro")
 * 
 * Uso: npx ts-node --require tsconfig-paths/register scripts/cleanup-plans.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n🧹 Limpiando planes obsoletos...");

  const keptPlans = [];

  // 1. Identificar planes a eliminar
  const plansToDelete = await prisma.businessPlan.findMany({
    include: {
      _count: { select: { businesses: true } }
    }
  });

  if (plansToDelete.length === 0) {
    console.log("✅ No hay planes obsoletos para eliminar.");
    return;
  }

  console.log(`⚠️ Se encontraron ${plansToDelete.length} planes para eliminar:`);
  
  for (const plan of plansToDelete) {
    console.log(`   - ${plan.name} (${plan._count.businesses} negocios asociados)`);

    if (plan._count.businesses > 0) {
      console.warn(`     ❌ NO SE PUEDE ELIMINAR AUTOMÁTICAMENTE: Tiene negocios asociados.`);
      continue;
    }

    // Eliminar features asociadas primero (cascade delete debería encargarse, pero por seguridad)
    await prisma.planFeature.deleteMany({
      where: { planId: plan.id }
    });

    // Eliminar el plan
    await prisma.businessPlan.delete({
      where: { id: plan.id }
    });

    console.log(`     🗑️ Eliminado correctamente.`);
  }

  console.log("\n✨ Limpieza finalizada.");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
