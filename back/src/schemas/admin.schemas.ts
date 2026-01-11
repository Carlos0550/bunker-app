import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
});

export const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().min(0).optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const changeBusinessPlanSchema = z.object({
  planId: z.string().uuid("ID de plan inválido"),
});
