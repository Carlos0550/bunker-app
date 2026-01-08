import client from '../client';
import { Sale, SaleItem } from '@/types';

export const salesApi = {
  createSale: async (saleData: { items: SaleItem[], paymentMethod: string, customerId?: string }): Promise<Sale> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Cálculo de totales simulado
    const subtotal = saleData.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.16; // 16% IVA ejemplo
    const total = subtotal + tax;

    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      items: saleData.items,
      subtotal,
      tax,
      discount: 0,
      total,
      paymentMethod: saleData.paymentMethod as any,
      status: 'completed',
      createdAt: new Date(),
      customerId: saleData.customerId
    };

    console.log('Venta registrada:', newSale);
    return newSale;

    // CÓDIGO REAL:
    // const response = await client.post<Sale>('/sales', saleData);
    // return response.data;
  },

  getRecentSales: async (): Promise<Sale[]> => {
    // MOCK
    await new Promise(resolve => setTimeout(resolve, 1000));
    return []; // Retornar lista vacía o mockData si se desea
    
    // CÓDIGO REAL:
    // const response = await client.get<Sale[]>('/sales/recent');
    // return response.data;
  }
};
