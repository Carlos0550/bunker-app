import client from '../client';

export interface SaleItem {
  productId?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  isManual?: boolean;
}

export interface CreateSaleData {
  customerId?: string;
  items: SaleItem[];
  taxRate?: number;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
  isCredit?: boolean;
  notes?: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  businessId: string;
  customerId?: string;
  userId: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType?: string;
  discountValue?: number;
  total: number;
  paymentMethod: string;
  status: string;
  isCredit: boolean;
  notes?: string;
  items: {
    id: string;
    productId?: string;
    productName: string;
    productSku?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isManual: boolean;
  }[];
  customer?: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ManualProduct {
  id: string;
  businessId: string;
  originalText: string;
  name: string;
  quantity: number;
  price: number;
  suggestedProductId?: string;
  linkedProductId?: string;
  status: 'PENDING' | 'LINKED' | 'CONVERTED' | 'IGNORED';
  createdAt: string;
  suggestions?: {
    id: string;
    name: string;
    sale_price?: number;
  }[];
}

export interface ParsedManualProduct {
  originalText: string;
  quantity: number;
  name: string;
  price: number;
}

export const salesApi = {
  // Crear venta
  createSale: async (data: CreateSaleData): Promise<Sale> => {
    const response = await client.post<{ success: boolean; data: Sale }>('/sales', data);
    return response.data.data;
  },

  // Obtener ventas
  getSales: async (params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    customerId?: string;
    isCredit?: boolean;
    paymentMethod?: string;
  } = {}): Promise<{ data: Sale[]; pagination: any }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const response = await client.get<{ success: boolean; data: Sale[]; pagination: any }>(
      `/sales?${searchParams}`
    );
    return { data: response.data.data, pagination: response.data.pagination };
  },

  // Obtener una venta
  getSale: async (id: string): Promise<Sale> => {
    const response = await client.get<{ success: boolean; data: Sale }>(`/sales/${id}`);
    return response.data.data;
  },

  // Cancelar venta
  cancelSale: async (id: string): Promise<void> => {
    await client.post(`/sales/${id}/cancel`);
  },

  // Parsear texto de producto manual
  parseManualProductText: async (text: string): Promise<ParsedManualProduct | null> => {
    try {
      const response = await client.post<{ success: boolean; data: ParsedManualProduct }>(
        '/sales/manual-products/parse',
        { text }
      );
      return response.data.data;
    } catch {
      return null;
    }
  },

  // Crear producto manual
  createManualProduct: async (data: {
    originalText: string;
    name: string;
    quantity: number;
    price: number;
  }): Promise<{ manualProduct: ManualProduct; suggestions: any[] }> => {
    const response = await client.post<{
      success: boolean;
      data: { manualProduct: ManualProduct; suggestions: any[] };
    }>('/sales/manual-products', data);
    return response.data.data;
  },

  // Obtener productos manuales
  getManualProducts: async (status?: string): Promise<ManualProduct[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await client.get<{ success: boolean; data: ManualProduct[] }>(
      `/sales/manual-products${params}`
    );
    return response.data.data;
  },

  // Vincular producto manual
  linkManualProduct: async (id: string, productId: string): Promise<void> => {
    await client.post(`/sales/manual-products/${id}/link`, { productId });
  },

  // Convertir producto manual
  convertManualProduct: async (id: string, additionalData?: any): Promise<any> => {
    const response = await client.post<{ success: boolean; data: any }>(
      `/sales/manual-products/${id}/convert`,
      additionalData || {}
    );
    return response.data.data;
  },

  // Ignorar producto manual
  ignoreManualProduct: async (id: string): Promise<void> => {
    await client.post(`/sales/manual-products/${id}/ignore`);
  },
};
