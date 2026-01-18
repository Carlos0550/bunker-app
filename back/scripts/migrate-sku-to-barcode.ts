import { prisma } from "../src/config/db";

async function main() {
  console.log("🚀 Iniciando migración de SKU a Barcode...");

  try {
    // 1. Obtener todos los productos que tienen SKU
    const products = await prisma.products.findMany({
      where: {
        sku: {
          not: null,
        },
      },
      select: {
        id: true,
        sku: true,
        bar_code: true,
        name: true,
      },
    });

    console.log(`📦 Se encontraron ${products.length} productos con SKU.`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. Iterar y validar
    for (const product of products) {
      if (!product.sku) continue;

      const sku = product.sku.trim();

      // Verificar si es un número entero válido (solo dígitos)
      const isNumeric = /^\d+$/.test(sku);

      if (isNumeric) {
        // Verificar si ya tiene el mismo código de barras para no reescribir innecesariamente
        if (product.bar_code === sku) {
            skippedCount++;
            continue;
        }

        try {
          await prisma.products.update({
            where: { id: product.id },
            data: {
              bar_code: sku,
            },
          });
          updatedCount++;
          console.log(`✅ Actualizado: ${product.name} (SKU: ${sku} -> Barcode)`);
        } catch (error) {
          console.error(`❌ Error actualizando ${product.name} (ID: ${product.id}):`, error);
          errorCount++;
        }
      } else {
        console.log(`⚠️ Omitido (No numérico): ${product.name} (SKU: "${sku}")`);
        skippedCount++;
      }
    }

    console.log("\n📊 Resumen de migración:");
    console.log(`✅ Actualizados: ${updatedCount}`);
    console.log(`⚠️ Omitidos (No numéricos o sin cambios): ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);

  } catch (error) {
    console.error("❌ Error general en el script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
