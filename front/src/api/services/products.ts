import client from "../client";

export interface Product {
  id: string;
  name: string;
  stock: number;
  bar_code?: string;
  image?: string;
  imageUrl?: string;
  description?: string;
  state: "ACTIVE" | "DISABLED" | "DELETED" | "OUT_OF_STOCK";
  sku?: string;
  cost_price?: number;
  sale_price?: number;
  min_stock: number;
  reserved_stock: number;
  notes?: string;
  system_message?: string;
  multipliers?: any;
  categoryId?: string;
  supplierId?: string;
  category?: { id: string; name: string };
  supplier?: { id: string; name: string };
  businessId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  state?: string;
  lowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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

export interface UpdateProductData extends Partial<CreateProductData> {
  state?: "ACTIVE" | "DISABLED" | "OUT_OF_STOCK";
  reserved_stock?: number;
  system_message?: string;
}

export interface Category {
  id: string;
  name: string;
  businessId: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const productsApi = {
  
  getProducts: async (
    filters: ProductFilters = {},
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.state) params.append("state", filters.state);
    if (filters.lowStock) params.append("lowStock", "true");
    if (filters.minPrice !== undefined)
      params.append("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== undefined)
      params.append("maxPrice", String(filters.maxPrice));

    if (pagination.page) params.append("page", String(pagination.page));
    if (pagination.limit) params.append("limit", String(pagination.limit));
    if (pagination.sortBy) params.append("sortBy", pagination.sortBy);
    if (pagination.sortOrder) params.append("sortOrder", pagination.sortOrder);

    const response = await client.get<PaginatedResponse<Product>>(
      `/products?${params}`,
    );
    return response.data;
  },

  
  getProduct: async (id: string): Promise<Product> => {
    const response = await client.get<{ success: boolean; data: Product }>(
      `/products/${id}`,
    );
    return response.data.data;
  },

  
  createProduct: async (data: CreateProductData): Promise<Product> => {
    const response = await client.post<{ success: boolean; data: Product }>(
      "/products",
      data,
    );
    return response.data.data;
  },

  
  createProductsBulk: async (
    products: CreateProductData[],
  ): Promise<{
    created: Product[];
    errors: { index: number; error: string }[];
  }> => {
    const response = await client.post<{
      success: boolean;
      data: { created: Product[]; errors: { index: number; error: string }[] };
    }>("/products/bulk", { products });
    return response.data.data;
  },

  
  updateProduct: async (
    id: string,
    data: UpdateProductData,
  ): Promise<Product> => {
    const response = await client.patch<{ success: boolean; data: Product }>(
      `/products/${id}`,
      data,
    );
    return response.data.data;
  },

  
  updateProductImage: async (
    id: string,
    file: File,
  ): Promise<{ url: string; fileName: string }> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await client.patch<{
      success: boolean;
      data: { url: string; fileName: string };
    }>(`/products/${id}/image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  
  updateStock: async (
    id: string,
    quantity: number,
    operation: "add" | "subtract" | "set",
  ): Promise<Product> => {
    const response = await client.patch<{ success: boolean; data: Product }>(
      `/products/${id}/stock`,
      { quantity, operation },
    );
    return response.data.data;
  },

  
  deleteProduct: async (id: string): Promise<void> => {
    await client.delete(`/products/${id}`);
  },

  
  permanentDeleteProduct: async (id: string): Promise<void> => {
    await client.delete(`/products/${id}/permanent`);
  },

  
  restoreProduct: async (id: string): Promise<void> => {
    await client.post(`/products/${id}/restore`);
  },

  
  getDeletedProducts: async (
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    if (pagination.page) params.append("page", String(pagination.page));
    if (pagination.limit) params.append("limit", String(pagination.limit));

    const response = await client.get<PaginatedResponse<Product>>(
      `/products/deleted?${params}`,
    );
    return response.data;
  },

  
  getLowStockProducts: async (): Promise<
    (Product & { threshold: number; deficit: number })[]
  > => {
    const response = await client.get<{
      success: boolean;
      data: (Product & { threshold: number; deficit: number })[];
    }>("/products/low-stock");
    return response.data.data;
  },

  
  findByBarcode: async (barcode: string): Promise<Product | null> => {
    try {
      const response = await client.get<{ success: boolean; data: Product }>(
        `/products/barcode/${barcode}`,
      );
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  
  getCategories: async (): Promise<Category[]> => {
    const response = await client.get<{ success: boolean; data: Category[] }>(
      "/products/categories",
    );
    return response.data.data;
  },

  
  createCategory: async (name: string): Promise<Category> => {
    const response = await client.post<{ success: boolean; data: Category }>(
      "/products/categories",
      { name },
    );
    return response.data.data;
  },

  
  updateCategory: async (id: string, name: string): Promise<Category> => {
    const response = await client.patch<{ success: boolean; data: Category }>(
      `/products/categories/${id}`,
      { name },
    );
    return response.data.data;
  },

  
  deleteCategory: async (id: string): Promise<void> => {
    await client.delete(`/products/categories/${id}`);
  },
};
