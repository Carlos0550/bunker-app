import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  stock: z.number().int().min(0).optional().default(0),
  bar_code: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  cost_price: z.number().min(0).optional(),
  sale_price: z.number().min(0).optional(),
  min_stock: z.number().int().min(0).optional().default(5),
  categoryId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  notes: z.string().optional(),
  multipliers: z.any().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  bar_code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  state: z.enum(["ACTIVE", "DISABLED", "OUT_OF_STOCK"]).optional(),
  sku: z.string().optional().nullable(),
  cost_price: z.number().min(0).optional().nullable(),
  sale_price: z.number().min(0).optional().nullable(),
  min_stock: z.number().int().min(0).optional(),
  reserved_stock: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  system_message: z.string().optional().nullable(),
  multipliers: z.any().optional(),
});

export const createProductsBulkSchema = z.object({
  products: z.array(createProductSchema).min(1, "Debe incluir al menos un producto"),
});

export const updateStockSchema = z.object({
  quantity: z.number().int().min(0, "La cantidad debe ser positiva"),
  operation: z.enum(["add", "subtract", "set"]),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
});
