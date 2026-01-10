/**
 * Script para crear/actualizar los planes por defecto
 * 
 * Uso: npx ts-node --require tsconfig-paths/register scripts/seed-plans.ts
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
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║           BUNKER - Seed de Planes y Features              ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Features por defecto
  console.log("📦 Creando/actualizando features...");
  
  const defaultFeatures = [
    { code: "MAX_PRODUCTS", name: "Límite de Productos", description: "Número máximo de productos", valueType: "NUMBER" as const },
    { code: "MAX_USERS", name: "Límite de Usuarios", description: "Número máximo de usuarios", valueType: "NUMBER" as const },
    { code: "MAX_SALES_PER_MONTH", name: "Límite de Ventas Mensuales", description: "Ventas máximas por mes", valueType: "NUMBER" as const },
    { code: "REPORTS_ACCESS", name: "Acceso a Reportes", description: "Permite acceder a reportes", valueType: "BOOLEAN" as const },
    { code: "ADVANCED_ANALYTICS", name: "Analíticas Avanzadas", description: "Métricas avanzadas", valueType: "BOOLEAN" as const },
    { code: "EXPORT_DATA", name: "Exportar Datos", description: "Exportar a Excel/CSV", valueType: "BOOLEAN" as const },
    { code: "MULTI_BRANCH", name: "Multi-Sucursal", description: "Múltiples sucursales", valueType: "BOOLEAN" as const },
    { code: "API_ACCESS", name: "Acceso API", description: "Acceso a la API", valueType: "BOOLEAN" as const },
    { code: "CUSTOM_BRANDING", name: "Marca Personalizada", description: "Logo personalizado", valueType: "BOOLEAN" as const },
    { code: "PRIORITY_SUPPORT", name: "Soporte Prioritario", description: "Soporte técnico prioritario", valueType: "BOOLEAN" as const },
  ];

  for (const feature of defaultFeatures) {
    await prisma.feature.upsert({
      where: { code: feature.code },
      create: feature,
      update: { name: feature.name, description: feature.description },
    });
  }

  console.log(`   ✅ ${defaultFeatures.length} features creadas/actualizadas`);

  // Planes por defecto
  console.log("\n📋 Creando/actualizando planes...");

  const defaultPlans = [
    {
      name: "Básico",
      price: 299,
      description: "Ideal para pequeños negocios",
      features: [
        "Hasta 100 productos",
        "1 usuario",
        "500 ventas/mes",
        "Reportes básicos",
        "Soporte por email",
      ],
    },
    {
      name: "Profesional",
      price: 599,
      description: "Para negocios en crecimiento",
      features: [
        "Hasta 1,000 productos",
        "5 usuarios",
        "Ventas ilimitadas",
        "Reportes avanzados",
        "Exportar datos",
        "Soporte prioritario",
      ],
    },
    {
      name: "Empresarial",
      price: 999,
      description: "Solución completa para empresas",
      features: [
        "Productos ilimitados",
        "Usuarios ilimitados",
        "Ventas ilimitadas",
        "Analíticas avanzadas",
        "Multi-sucursal",
        "API access",
        "Marca personalizada",
        "Soporte 24/7",
      ],
    },
  ];

  for (const plan of defaultPlans) {
    const created = await prisma.businessPlan.upsert({
      where: { name: plan.name },
      create: plan,
      update: { 
        price: plan.price, 
        description: plan.description,
        features: plan.features,
      },
    });
    console.log(`   ✅ Plan "${created.name}" - $${created.price}/mes`);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    ✅ SEED COMPLETADO                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
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
