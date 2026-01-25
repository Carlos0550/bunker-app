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
  notes?: string;
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

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string | null;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isManual: boolean;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    sale_price: number | null;
    stock: number;
  };
}

export interface SaleWithItems {
  id: string;
  saleNumber: string | null;
  businessId: string;
  customerId: string | null;
  userId: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: string | null;
  discountValue: number | null;
  total: number;
  paymentMethod: string;
  status: string;
  isCredit: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: SaleItem[];
  currentAccount: CurrentAccount | null;
}

export interface AddSaleItemData {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  isManual?: boolean;
}

export interface UpdateSaleItemData {
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
}

export const customersApi = {
  
  createCustomer: async (data: CreateCustomerData): Promise<BusinessCustomer> => {
    const response = await client.post<{ success: boolean; data: BusinessCustomer }>(
      '/customers',
      data
    );
    return response.data.data;
  },

  
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

  
  getAccountPayments: async (accountId: string): Promise<AccountPayment[]> => {
    const response = await client.get<{ success: boolean; data: AccountPayment[] }>(
      `/customers/accounts/${accountId}/payments`
    );
    return response.data.data;
  },

  
  getAccountsSummary: async (): Promise<AccountsSummary> => {
    const response = await client.get<{ success: boolean; data: AccountsSummary }>(
      '/customers/accounts/summary'
    );
    return response.data.data;
  },

  
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

  
  getSaleItems: async (saleId: string): Promise<SaleWithItems> => {
    const response = await client.get<{ success: boolean; data: SaleWithItems }>(
      `/customers/sales/${saleId}/items`
    );
    return response.data.data;
  },

  addSaleItem: async (saleId: string, itemData: AddSaleItemData): Promise<{ item: SaleItem; sale: any }> => {
    const response = await client.post<{ success: boolean; data: { item: SaleItem; sale: any } }>(
      `/customers/sales/${saleId}/items`,
      itemData
    );
    return response.data.data;
  },

  updateSaleItem: async (itemId: string, updateData: UpdateSaleItemData): Promise<{ item: SaleItem; sale: any }> => {
    const response = await client.patch<{ success: boolean; data: { item: SaleItem; sale: any } }>(
      `/customers/sales/items/${itemId}`,
      updateData
    );
    return response.data.data;
  },

  deleteSaleItem: async (itemId: string): Promise<{ sale: any }> => {
    const response = await client.delete<{ success: boolean; data: { sale: any } }>(
      `/customers/sales/items/${itemId}`
    );
    return response.data.data;
  },

  
  updateAccountNotes: async (accountId: string, notes: string): Promise<CurrentAccount> => {
    const response = await client.patch<{ success: boolean; data: CurrentAccount }>(
      `/customers/accounts/${accountId}/notes`,
      { notes }
    );
    return response.data.data;
  },
};
