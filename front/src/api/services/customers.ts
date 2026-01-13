import client from '../client';

export interface Customer {
  id: string;
  identifier: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCustomer {
  id: string;
  businessId: string;
  customerId: string;
  creditLimit?: number;
  notes?: string;
  customer: Customer;
  totalDebt?: number;
  activeAccounts?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentAccount {
  id: string;
  businessCustomerId: string;
  saleId: string;
  originalAmount: number;
  currentBalance: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  paidAt?: string;
  businessCustomer?: {
    customer: Customer;
  };
  sale?: {
    saleNumber: string;
    total: number;
    items: any[];
    createdAt: string;
  };
  payments: AccountPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface AccountPayment {
  id: string;
  currentAccountId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

export interface AccountsSummary {
  totalAccounts: number;
  pendingAccounts: number;
  partialAccounts: number;
  paidAccounts: number;
  totalDebt: number;
  totalOriginal: number;
  topDebtors: {
    customer: Customer;
    debt: number;
  }[];
}

export interface CustomerMetrics {
  customer: Customer;
  creditLimit?: number;
  notes?: string;
  totalAccountsCount: number;
  paidAccountsCount: number;
  pendingAccountsCount: number;
  averagePaymentDays: number | null;
  paidOnTimeCount: number;
  totalDebt: number;
  totalPaid: number;
  accountsByMonth: {
    monthKey: string;
    accounts: CurrentAccount[];
  }[];
}

export interface CreateCustomerData {
  identifier: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  notes?: string;
}

export const customersApi = {
  // Crear cliente
  createCustomer: async (data: CreateCustomerData): Promise<BusinessCustomer> => {
    const response = await client.post<{ success: boolean; data: BusinessCustomer }>(
      '/customers',
      data
    );
    return response.data.data;
  },

  // Obtener clientes
  getCustomers: async (params: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: BusinessCustomer[]; pagination: any }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const response = await client.get<{
      success: boolean;
      data: BusinessCustomer[];
      pagination: any;
    }>(`/customers?${searchParams}`);
    return { data: response.data.data, pagination: response.data.pagination };
  },

  // Obtener detalle de cliente
  getCustomerDetail: async (id: string): Promise<BusinessCustomer & {
    totalDebt: number;
    totalPaid: number;
    currentAccounts: CurrentAccount[];
  }> => {
    const response = await client.get<{ success: boolean; data: any }>(
      `/customers/${id}`
    );
    return response.data.data;
  },

  // Actualizar cliente
  updateCustomer: async (
    id: string,
    data: { creditLimit?: number; notes?: string }
  ): Promise<BusinessCustomer> => {
    const response = await client.patch<{ success: boolean; data: BusinessCustomer }>(
      `/customers/${id}`,
      data
    );
    return response.data.data;
  },

  // Obtener cuentas corrientes
  getCurrentAccounts: async (params: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: CurrentAccount[]; pagination: any }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const response = await client.get<{
      success: boolean;
      data: CurrentAccount[];
      pagination: any;
    }>(`/customers/accounts?${searchParams}`);
    return { data: response.data.data, pagination: response.data.pagination };
  },

  // Registrar pago
  registerPayment: async (
    accountId: string,
    data: {
      amount: number;
      paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
      notes?: string;
    }
  ): Promise<{ isPaid: boolean; message: string }> => {
    const response = await client.post<{
      success: boolean;
      data: { isPaid: boolean; message: string };
    }>(`/customers/accounts/${accountId}/payment`, data);
    return response.data.data;
  },

  // Obtener historial de pagos
  getAccountPayments: async (accountId: string): Promise<AccountPayment[]> => {
    const response = await client.get<{ success: boolean; data: AccountPayment[] }>(
      `/customers/accounts/${accountId}/payments`
    );
    return response.data.data;
  },

  // Obtener resumen de cuentas
  getAccountsSummary: async (): Promise<AccountsSummary> => {
    const response = await client.get<{ success: boolean; data: AccountsSummary }>(
      '/customers/accounts/summary'
    );
    return response.data.data;
  },

  // Obtener métricas de un cliente
  getCustomerMetrics: async (id: string): Promise<CustomerMetrics> => {
    const response = await client.get<{ success: boolean; data: CustomerMetrics }>(
      `/customers/${id}/metrics`
    );
    return response.data.data;
  },

  deleteCustomer: async(id: string): Promise<string> => {
    const response = await client.delete<{ success: boolean; message: string }>(
      `/customers/${id}`
    );
    return response.data.message;
  },
};
