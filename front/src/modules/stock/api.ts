import { httpClient } from '@services/http';
import type { Product, CreateProductData, UpdateProductData } from './types';
import type { PaginatedResponse } from '@shared/types';

export const stockApi = {
  getProducts: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedResponse<Product>> => {
    const response = await httpClient.get<PaginatedResponse<Product>>('/products', { params });
    return response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await httpClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (data: CreateProductData): Promise<Product> => {
    const response = await httpClient.post<Product>('/products', data);
    return response.data;
  },

  updateProduct: async (id: string, data: UpdateProductData): Promise<Product> => {
    const response = await httpClient.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await httpClient.delete(`/products/${id}`);
  },
};


