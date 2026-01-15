import client from '../client';

export interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  dailyChange: number;
  totalProducts: number;
  lowStockProducts: number;
  monthlyGrowth: number;
  totalSales: number;
  totalRevenue: number;
}

export interface SalesSummary {
  period: { startDate: string; endDate: string };
  totalSales: number;
  totalRevenue: number;
  totalItems: number;
  averageTicket: number;
  salesByPaymentMethod: {
    paymentMethod: string;
    count: number;
    total: number;
  }[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  salesCount: number;
  quantitySold: number;
  revenue: number;
  product?: {
    id: string;
    name: string;
    sale_price: number;
    stock: number;
    image?: string;
  };
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  sale_price?: number;
  image?: string;
  threshold: number;
  deficit: number;
}

export interface ChartDataPoint {
  name: string;
  date: string;
  ventas: number;
}

export interface RecentSale {
  id: string;
  saleNumber: string;
  customerName: string;
  total: number;
  itemCount: number;
  paymentMethod: string;
  createdAt: string;
  processedBy?: string;
}

export const analyticsApi = {
  // Dashboard stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await client.get<{ success: boolean; data: DashboardStats }>('/analytics/dashboard');
    return response.data.data;
  },

  // Sales summary
  getSalesSummary: async (
    period: 'today' | 'yesterday' | 'week' | 'month' | 'custom' = 'today',
    startDate?: string,
    endDate?: string
  ): Promise<SalesSummary> => {
    const params = new URLSearchParams({ period });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await client.get<{ success: boolean; data: SalesSummary }>(
      `/analytics/sales-summary?${params}`
    );
    return response.data.data;
  },

  // Top products
  getTopProducts: async (limit: number = 10, period?: string): Promise<TopProduct[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (period) params.append('period', period);

    const response = await client.get<{ success: boolean; data: TopProduct[] }>(
      `/analytics/top-products?${params}`
    );
    return response.data.data;
  },

  // Low stock products
  getLowStockProducts: async (): Promise<LowStockProduct[]> => {
    const response = await client.get<{ success: boolean; data: LowStockProduct[] }>(
      '/analytics/low-stock-products'
    );
    return response.data.data;
  },

  // Sales chart (supports period filter)
  getSalesChart: async (period: 'today' | 'yesterday' | 'week' | 'month' = 'week'): Promise<ChartDataPoint[]> => {
    const response = await client.get<{ success: boolean; data: ChartDataPoint[] }>(
      `/analytics/weekly-chart?period=${period}`
    );
    return response.data.data;
  },

  // Weekly sales chart (legacy, for dashboard)
  getWeeklySalesChart: async (): Promise<ChartDataPoint[]> => {
    const response = await client.get<{ success: boolean; data: ChartDataPoint[] }>(
      '/analytics/weekly-chart'
    );
    return response.data.data;
  },

  // Recent sales
  getRecentSales: async (limit: number = 5): Promise<RecentSale[]> => {
    const response = await client.get<{ success: boolean; data: RecentSale[] }>(
      `/analytics/recent-sales?limit=${limit}`
    );
    return response.data.data;
  },
};
