export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface StockFilters {
  search?: string;
  category?: string;
  minStock?: number;
  maxStock?: number;
}


