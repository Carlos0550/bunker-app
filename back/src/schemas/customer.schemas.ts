import { z } from "zod";

export const createCustomerSchema = z.object({
  identifier: z.string().min(1, "El identificador es requerido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const updateBusinessCustomerSchema = z.object({
  creditLimit: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const registerPaymentSchema = z.object({
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]),
  notes: z.string().optional(),
});
