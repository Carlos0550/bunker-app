/**
 * Script de diagnóstico para problemas con Mercado Pago
 * Ejecutar con: npx ts-node scripts/diagnose-mercadopago.ts
 */

import dotenv from "dotenv";
import path from "path";

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, "../.env") });

async function diagnoseMercadoPago() {
  console.log("🔍 Diagnóstico de configuración de Mercado Pago\n");
  console.log("=" .repeat(60));

  // 1. Verificar variable de entorno
  console.log("\n1️⃣ Verificando variable MERCADOPAGO_ACCESS_TOKEN:");
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  if (!token) {
    console.error("❌ MERCADOPAGO_ACCESS_TOKEN no está configurado");
    console.log("\n📝 Solución:");
    console.log("   Agrega MERCADOPAGO_ACCESS_TOKEN a tu archivo .env");
    return;
  }

  const cleanToken = token.trim().replace(/^["']|["']$/g, "");
  
  console.log("✅ Token encontrado");
  console.log(`   Longitud: ${cleanToken.length} caracteres`);
  console.log(`   Prefijo: ${cleanToken.substring(0, 10)}...`);
  
  if (cleanToken.startsWith("TEST-")) {
    console.log("   Tipo: Token de PRUEBA (sandbox)");
  } else if (cleanToken.startsWith("APP_USR-")) {
    console.log("   Tipo: Token de PRODUCCIÓN");
  } else {
    console.warn("   ⚠️ Formato de token desconocido");
    console.warn("   Los tokens válidos deben comenzar con 'TEST-' o 'APP_USR-'");
  }

  // 2. Verificar otros parámetros
  console.log("\n2️⃣ Verificando otras variables de entorno:");
  const appUrl = process.env.APP_URL || process.env.BACKEND_URL;
  console.log(`   APP_URL/BACKEND_URL: ${appUrl || "No configurado"}`);
  
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  console.log(`   MERCADOPAGO_WEBHOOK_SECRET: ${webhookSecret ? "Configurado" : "No configurado"}`);

  // 3. Intentar crear cliente
  console.log("\n3️⃣ Verificando creación del cliente:");
  try {
    const { MercadoPagoConfig } = await import("mercadopago");
    const config = {
      accessToken: cleanToken,
      options: {
        timeout: 5000,
      },
    };
    
    const client = new MercadoPagoConfig(config);
    console.log("✅ Cliente MercadoPagoConfig creado exitosamente");
  } catch (error: any) {
    console.error("❌ Error al crear cliente:", error.message);
    return;
  }

  // 4. Instrucciones para resolver error 403
  console.log("\n4️⃣ Si recibes error 403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES:");
  console.log("\n📋 Posibles causas y soluciones:");
  console.log("\n   A) Perfil de cuenta incompleto:");
  console.log("      1. Ve a tu cuenta de Mercado Pago");
  console.log("      2. Completa tu perfil con todos los datos requeridos");
  console.log("      3. Verifica que no haya documentos pendientes");
  console.log("      4. Espera a que se complete la verificación de identidad");
  console.log("\n   B) Token inválido o expirado:");
  console.log("      1. Ve a https://www.mercadopago.com.ar/developers/panel/app");
  console.log("      2. Selecciona tu aplicación");
  console.log("      3. Ve a 'Credenciales'");
  console.log("      4. Regenera el Access Token");
  console.log("      5. Actualiza MERCADOPAGO_ACCESS_TOKEN en tu .env");
  console.log("      6. Reinicia tu servidor");
  console.log("\n   C) Problemas con usuarios de prueba:");
  console.log("      - Asegúrate de usar usuarios de prueba válidos en sandbox");
  console.log("      - No uses cuentas reales en el entorno de pruebas");
  console.log("\n   D) Campos inválidos en la preferencia:");
  console.log("      - El código ahora usa una estructura mínima");
  console.log("      - Revisa los logs para ver qué campos se están enviando");

  // 5. Verificar formato del token
  console.log("\n5️⃣ Verificando formato del token:");
  if (cleanToken.length < 30) {
    console.warn("   ⚠️ El token parece muy corto (debería tener al menos 30 caracteres)");
  }
  
  if (cleanToken.includes(" ")) {
    console.warn("   ⚠️ El token contiene espacios (puede causar problemas)");
  }
  
  if (cleanToken.includes('"') || cleanToken.includes("'")) {
    console.warn("   ⚠️ El token contiene comillas (puede causar problemas)");
    console.log("   💡 El código debería limpiar las comillas automáticamente");
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Diagnóstico completado");
  console.log("\n💡 Si el problema persiste después de seguir estos pasos,");
  console.log("   verifica que estés usando el token correcto para tu entorno");
  console.log("   (TEST- para desarrollo, APP_USR- para producción)");
}

diagnoseMercadoPago().catch(console.error);
