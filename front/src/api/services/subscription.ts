import client from '../client';

export interface PlanFeature {
  feature: string;
  code: string;
  value: string;
  valueType?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description?: string;
  features: string[];
  planFeatures: PlanFeature[];
}

export interface SubscriptionStatus {
  status: 'active' | 'trial' | 'expired' | 'grace_period';
  daysRemaining: number;
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  isTrial: boolean;
}

export interface CurrentPlanData {
  business: {
    id: string;
    name: string;
  };
  plan: Plan | null;
  subscription: SubscriptionStatus;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  date: string;
  nextPaymentDate?: string;
  isTrial: boolean;
  attempts?: {
    id: string;
    attemptNumber: number;
    status: string;
    errorMessage?: string;
  }[];
}

export interface PaymentHistoryResponse {
  data: PaymentHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const subscriptionApi = {
  
  getCurrentPlan: async (): Promise<CurrentPlanData> => {
    const response = await client.get<{ success: boolean; data: CurrentPlanData }>(
      '/subscription/current'
    );
    return response.data.data;
  },

  
  getPaymentHistory: async (page = 1, limit = 10): Promise<PaymentHistoryResponse> => {
    const response = await client.get<{ success: boolean; data: PaymentHistory[]; pagination: any }>(
      `/subscription/payments?page=${page}&limit=${limit}`
    );
    return { data: response.data.data, pagination: response.data.pagination };
  },

  
  getAvailablePlans: async (): Promise<Plan[]> => {
    const response = await client.get<{ success: boolean; data: Plan[] }>(
      '/subscription/plans'
    );
    return response.data.data;
  },

  
  changePlan: async (planId: string): Promise<{ success: boolean; message: string; newPlan: Plan }> => {
    const response = await client.post<{ success: boolean; data: { success: boolean; message: string; newPlan: Plan } }>(
      '/subscription/change-plan',
      { planId }
    );
    return response.data.data;
  },

  
  createMercadoPagoPreference: async (planId: string): Promise<{ preferenceId: string; initPoint: string; sandboxInitPoint: string }> => {
    const response = await client.post<{ success: boolean; data: { preferenceId: string; initPoint: string; sandboxInitPoint: string } }>(
      '/subscription/mercadopago/create-preference',
      { planId }
    );
    return response.data.data;
  },

  
  registerManualPayment: async (data: { businessId: string; amount: number; months: number; notes?: string }): Promise<any> => {
    const response = await client.post(
      '/subscription/manual-payment',
      data
    );
    return response.data;
  },
};
