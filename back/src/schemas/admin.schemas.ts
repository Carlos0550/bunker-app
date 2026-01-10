import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  planFeatures: z
    .array(
      z.object({
        featureId: z.string().uuid(),
        value: z.string(),
      })
    )
    .optional(),
});

export const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().min(0).optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const assignFeatureSchema = z.object({
  featureId: z.string().uuid("ID de feature inválido"),
  value: z.string().min(1, "El valor es requerido"),
});

export const createFeatureSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z_]+$/, "El código debe estar en mayúsculas con guiones bajos"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  valueType: z.enum(["BOOLEAN", "NUMBER", "STRING"]),
});

export const updateFeatureSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

export const changeBusinessPlanSchema = z.object({
  planId: z.string().uuid("ID de plan inválido"),
});
