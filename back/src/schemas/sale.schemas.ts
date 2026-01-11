import { z } from "zod";
const saleItemSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1),
  productSku: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  isManual: z.boolean().optional().default(false),
});
export const createSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(saleItemSchema).min(1, "La venta debe tener al menos un item"),
  taxRate: z.number().min(0).max(1).optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().min(0).optional(),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]),
  isCredit: z.boolean().optional().default(false),
  notes: z.string().optional(),
});
export const manualProductSchema = z.object({
  originalText: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
});
export const linkManualProductSchema = z.object({
  productId: z.string().uuid(),
});
export const updateManualProductSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  status: z.enum(["PENDING", "LINKED", "CONVERTED", "IGNORED"]).optional(),
});
export const parseManualTextSchema = z.object({
  text: z.string().min(1),
});
