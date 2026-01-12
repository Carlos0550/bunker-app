import { z } from "zod";
export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("El correo electrónico no es válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  businessName: z.string().min(2, "El nombre del negocio es requerido"),
  businessAddress: z.string().min(5, "La dirección del negocio es requerida"),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email("El email de contacto del negocio no es válido").optional(),
});
export const loginSchema = z.object({
  email: z.string().email("El correo electrónico no es válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});
export const updateUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  email: z.string().email("El correo electrónico no es válido").optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
});
export const recoverPasswordSchema = z.object({
  email: z.string().email("El correo electrónico no es válido"),
});
export const createAdminSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("El correo electrónico no es válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  businessId: z.string().uuid("ID de negocio inválido"),
});
export const createUserByAdminSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("El correo electrónico no es válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.number().int().min(1).max(2),
  permissions: z.array(z.string()).optional(),
  businessId: z.string().uuid("ID de negocio inválido"),
});
export const updateUserByAdminSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  email: z.string().email("El correo electrónico no es válido").optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  role: z.number().int().min(1).max(2).optional(),
  permissions: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DELETED"]).optional(),
});