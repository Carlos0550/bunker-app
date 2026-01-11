/**
 * Script para verificar la configuración de Mercado Pago
 * 
 * Uso: npx ts-node --require tsconfig-paths/register scripts/test-mercadopago-config.ts
 */

import dotenv from "dotenv";
dotenv.config();

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║     Verificación de Configuración de Mercado Pago         ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

console.log("📋 Variables de Entorno:\n");

if (accessToken) {
  const cleaned = accessToken.trim().replace(/^["']|["']$/g, "");
  console.log("✅ MERCADOPAGO_ACCESS_TOKEN:");
  console.log(`   Configurado: Sí`);
  console.log(`   Longitud: ${cleaned.length} caracteres`);
  console.log(`   Prefijo: ${cleaned.substring(0, 15)}...`);
  console.log(`   Tipo: ${cleaned.startsWith("TEST-") ? "Prueba" : cleaned.startsWith("APP_USR-") ? "Producción" : "Desconocido"}`);
} else {
  console.log("❌ MERCADOPAGO_ACCESS_TOKEN:");
  console.log("   Configurado: No");
  console.log("   ⚠️  Esta variable es REQUERIDA");
}

console.log("");

if (webhookSecret) {
  const cleaned = webhookSecret.trim().replace(/^["']|["']$/g, "");
  console.log("✅ MERCADOPAGO_WEBHOOK_SECRET:");
  console.log(`   Configurado: Sí`);
  console.log(`   Longitud: ${cleaned.length} caracteres`);
  console.log(`   Prefijo: ${cleaned.substring(0, 10)}...`);
} else {
  console.log("⚠️  MERCADOPAGO_WEBHOOK_SECRET:");
  console.log("   Configurado: No");
  console.log("   ⚠️  Recomendado para producción (validación de webhooks)");
}

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║                    ✅ VERIFICACIÓN COMPLETA                 ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

if (!accessToken) {
  console.log("❌ ERROR: MERCADOPAGO_ACCESS_TOKEN no está configurado");
  console.log("   Por favor, agrega esta variable a tu archivo .env\n");
  process.exit(1);
}

console.log("✅ Configuración básica correcta\n");
