import { ProductState } from "@prisma/client";

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  state?: ProductState;
  lowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateProductData {
  name: string;
  stock?: number;
  bar_code?: string;
  description?: string;
  sku?: string;
  cost_price?: number;
  sale_price?: number;
  min_stock?: number;
  categoryId?: string;
  supplierId?: string;
  notes?: string;
  multipliers?: any;
}

export interface UpdateProductData {
  name?: string;
  stock?: number;
  bar_code?: string;
  description?: string;
  state?: ProductState;
  sku?: string;
  cost_price?: number;
  sale_price?: number;
  min_stock?: number;
  reserved_stock?: number;
  categoryId?: string;
  supplierId?: string;
  notes?: string;
  system_message?: string;
  multipliers?: any;
}
