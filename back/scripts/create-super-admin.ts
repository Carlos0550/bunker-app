/**
 * Script para crear el Super Administrador del sistema
 * 
 * Uso: npx ts-node --require tsconfig-paths/register scripts/create-super-admin.ts
 * 
 * Variables de entorno requeridas:
 * - SUPER_ADMIN_EMAIL: Email del super admin
 * - SUPER_ADMIN_PASSWORD: Contraseña del super admin
 * - SUPER_ADMIN_NAME: Nombre del super admin
 */

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";
import readline from "readline";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function prompt(question: string, isPassword = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (isPassword) {
      // Para contraseñas, usamos un approach más simple
      process.stdout.write(question);
      let password = "";
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      
      const onData = (char: string) => {
        if (char === "\n" || char === "\r" || char === "\u0004") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onData);
          console.log();
          rl.close();
          resolve(password);
        } else if (char === "\u0003") {
          // Ctrl+C
          process.exit();
        } else if (char === "\u007F" || char === "\b") {
          // Backspace
          password = password.slice(0, -1);
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(question + "*".repeat(password.length));
        } else {
          password += char;
          process.stdout.write("*");
        }
      };
      
      process.stdin.on("data", onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║        BUNKER - Creación de Super Administrador           ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Verificar si ya existe un super admin
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: 0 },
  });

  if (existingSuperAdmin) {
    console.log("⚠️  Ya existe un Super Administrador en el sistema:");
    console.log(`   Email: ${existingSuperAdmin.email}`);
    console.log(`   Nombre: ${existingSuperAdmin.name}`);
    console.log(`   Creado: ${existingSuperAdmin.createdAt.toLocaleString()}`);
    console.log("\n❌ Solo puede existir un Super Administrador en el sistema.");
    
    const continueAnyway = await prompt("\n¿Desea actualizar la contraseña del Super Admin existente? (s/n): ");
    
    if (continueAnyway.toLowerCase() === "s") {
      const newPassword = await prompt("Nueva contraseña (mínimo 8 caracteres): ", true);
      
      if (newPassword.length < 8) {
        console.log("\n❌ La contraseña debe tener al menos 8 caracteres.");
        process.exit(1);
      }

      const hashedPassword = await hashPassword(newPassword);
      
      await prisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: { password: hashedPassword },
      });

      console.log("\n✅ Contraseña actualizada correctamente.");
    }
    
    process.exit(0);
  }

  // Obtener datos del super admin
  let email = process.env.SUPER_ADMIN_EMAIL;
  let password = process.env.SUPER_ADMIN_PASSWORD;
  let name = process.env.SUPER_ADMIN_NAME;

  if (!email) {
    email = await prompt("Email del Super Administrador: ");
  }

  if (!name) {
    name = await prompt("Nombre del Super Administrador: ");
  }

  if (!password) {
    password = await prompt("Contraseña (mínimo 8 caracteres): ", true);
  }

  // Validaciones
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log("\n❌ Email inválido.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.log("\n❌ La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  if (name.length < 2) {
    console.log("\n❌ El nombre debe tener al menos 2 caracteres.");
    process.exit(1);
  }

  // Verificar si el email ya está en uso
  const existingUser = await prisma.user.findFirst({
    where: { email },
  });

  if (existingUser) {
    console.log("\n❌ El email ya está registrado en el sistema.");
    process.exit(1);
  }

  // Crear el super admin
  const hashedPassword = await hashPassword(password);

  const superAdmin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 0, // Super Admin
      status: "ACTIVE",
      emailVerified: true, // El super admin no necesita verificar email
      businessId: null, // No está asociado a ningún negocio
    },
  });

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║              ✅ SUPER ADMINISTRADOR CREADO                 ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n   ID: ${superAdmin.id}`);
  console.log(`   Email: ${superAdmin.email}`);
  console.log(`   Nombre: ${superAdmin.name}`);
  console.log(`   Rol: Super Administrador (0)`);
  console.log(`   Creado: ${superAdmin.createdAt.toLocaleString()}`);
  console.log("\n⚠️  Guarde estas credenciales en un lugar seguro.");
  console.log("⚠️  Este usuario tiene acceso total al sistema.\n");
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
