/**
 * Script para crear/actualizar el plan único del sistema
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
  console.log("║           BUNKER - Seed del Plan de Pago                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // ==================== PLAN ÚNICO ====================
  console.log("📋 Creando/actualizando plan único...");

  const planData = {
    name: "Plan Estándar",
    price: 30000,
    description: "Todo lo que necesitas para hacer crecer tu negocio. Prueba gratis por 7 días.",
    features: [
      "Puntos de venta ilimitados",
      "Hasta 25,000 productos en inventario",
      "Reportes avanzados con analíticas detalladas",
      "Dashboard con métricas en tiempo real",
      "Clientes ilimitados con cuentas corrientes",
      "Ventas ilimitadas al mes",
      "Hasta 10 administradores/usuarios",
      "Gestión completa de clientes y proveedores",
      "Búsqueda de productos por nombre, SKU o código de barras",
      "Control de stock con alertas de bajo inventario",
      "Historial completo de transacciones y movimientos",
      "Exportación de datos a Excel/CSV",
      "Importación masiva ilimitada de productos en cualquier de los formatos soportados (csv, xlsx, xls)",
      "Analíticas avanzadas: productos más vendidos, tendencias, comparativas",
      "Gestión avanzada de categorías y proveedores",
      "Reportes personalizados por fechas y filtros",
      "Soporte prioritario 24/7 por email y chat",
      "Acceso anticipado a nuevas funcionalidades",
      "Funciones especiales con IA (Próximamente)",
      "Recordatorios automáticos de pagos pendientes a tus clientes"
    ],
    isActive: true,
  };

  // Desactivar todos los planes existentes primero
  await prisma.businessPlan.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Crear o actualizar el plan único
  const plan = await prisma.businessPlan.upsert({
    where: { name: planData.name },
    create: planData,
    update: {
      price: planData.price,
      description: planData.description,
      features: planData.features,
      isActive: true,
    },
  });

  console.log(`   ✅ Plan creado/actualizado: ${plan.name}`);
  console.log(`   💰 Precio: $${plan.price.toLocaleString()}/mes`);
  console.log(`   📝 Características: ${plan.features.length} configuradas`);
  console.log(`   🎁 Prueba gratuita: 7 días para todos los negocios nuevos`);

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    ✅ SEED COMPLETADO                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  console.log("ℹ️  Nota: Todos los negocios nuevos se asignarán automáticamente");
  console.log("   a este plan con 7 días de prueba gratuita.\n");
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
