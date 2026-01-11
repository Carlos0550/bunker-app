/**
 * Script para probar la creación de una preferencia MÍNIMA en Mercado Pago
 * Ejecutar con: npx ts-node scripts/test-mercadopago-minimal.ts
 */

import dotenv from "dotenv";
import path from "path";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, "../.env") });

async function testMinimalPreference() {
  console.log("🧪 Probando creación de preferencia MÍNIMA en Mercado Pago\n");
  console.log("=".repeat(60));

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim().replace(/^["']|["']$/g, "");
  
  if (!token) {
    console.error("❌ No hay token configurado");
    return;
  }

  console.log("\n📋 Información del token:");
  console.log(`   Longitud: ${token.length}`);
  console.log(`   Prefijo: ${token.substring(0, 15)}...`);
  console.log(`   Sufijo: ...${token.slice(-10)}`);

  try {
    console.log("\n🔧 Creando cliente MercadoPago...");
    const client = new MercadoPagoConfig({ accessToken: token });
    const preferenceClient = new Preference(client);

    // Preferencia ABSOLUTAMENTE MÍNIMA
    const minimalBody = {
      items: [
        {
          title: "Test Item",
          quantity: 1,
          unit_price: 100,
        },
      ],
    };

    console.log("\n📤 Enviando preferencia mínima:", JSON.stringify(minimalBody, null, 2));

    const result = await preferenceClient.create({ body: minimalBody });

    console.log("\n✅ ¡ÉXITO! Preferencia creada:");
    console.log(`   ID: ${result.id}`);
    console.log(`   Init Point: ${result.init_point}`);
    console.log(`   Sandbox Init Point: ${result.sandbox_init_point}`);

  } catch (error: any) {
    console.error("\n❌ Error al crear preferencia:");
    console.error(`   Status: ${error.status || error.statusCode}`);
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Bloqueado por: ${error.blocked_by}`);
    
    if (error.cause) {
      console.error(`   Causa: ${JSON.stringify(error.cause)}`);
    }

    console.log("\n💡 Recomendaciones:");
    console.log("   1. Verifica que tu cuenta de Mercado Pago esté completamente verificada");
    console.log("   2. Intenta crear una nueva aplicación en el panel de desarrolladores");
    console.log("   3. Genera un nuevo Access Token desde esa aplicación");
    console.log("   4. Asegúrate de que tu cuenta pueda recibir pagos");
  }

  console.log("\n" + "=".repeat(60));
}

testMinimalPreference().catch(console.error);
