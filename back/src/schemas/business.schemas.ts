import { z } from "zod";
export const updateBusinessContactSchema = z.object({
  businessId: z.string().uuid("ID de negocio inválido"),
  contact_phone: z.string().optional(),
  contact_email: z.string().email("El email de contacto no es válido").optional(),
});
export const setPaymentResponsibleSchema = z.object({
  businessId: z.string().uuid("ID de negocio inválido"),
  userId: z.string().uuid("ID de usuario inválido"),
});

export const updateBusinessDataSchema = z.object({
  businessId: z.uuid("ID de negocio inválido"),
  name: z.string().optional(),
  address: z.string().optional(),
});