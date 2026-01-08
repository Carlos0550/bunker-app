import client from '../client';
import { Product } from '@/types';
import { mockProducts } from '@/data/mockData'; // Usamos los datos mock existentes como base

export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    // MOCK: Retorna los datos locales simulando un fetch
    await new Promise(resolve => setTimeout(resolve, 800)); // Simular delay
    return mockProducts;

    // CÓDIGO REAL:
    // const response = await client.get<Product[]>('/products');
    // return response.data;
  },

  getById: async (id: string): Promise<Product | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProducts.find(p => p.id === id);

    // CÓDIGO REAL:
    // const response = await client.get<Product>(`/products/${id}`);
    // return response.data;
  },

  create: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newProduct = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    } as Product;
    console.log('Producto creado:', newProduct);
    return newProduct;

    // CÓDIGO REAL:
    // const response = await client.post<Product>('/products', product);
    // return response.data;
  },

  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Producto ${id} actualizado con:`, product);
    return { ...mockProducts[0], ...product } as Product; // Retorna algo dummy

    // CÓDIGO REAL:
    // const response = await client.put<Product>(`/products/${id}`, product);
    // return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Producto ${id} eliminado`);
    
    // CÓDIGO REAL:
    // await client.delete(`/products/${id}`);
  }
};
