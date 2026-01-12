import client from '../client';

export interface Business {
  id: string;
  name: string;
  address: string;
  contact_phone?: string;
  contact_email?: string;
  business_page?: string;
  lowStockThreshold: number;
  businessPlanId: string;
  paymentResponsibleUserId?: string;
  paymentResponsibleUser?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const businessApi = {
  getBusiness: async (businessId: string): Promise<Business> => {
    const response = await client.get<{ success: boolean; data: Business }>(
      `/business/${businessId}`
    );
    return response.data.data;
  },

  updateContact: async (data: {
    businessId: string;
    contact_phone?: string;
    contact_email?: string;
  }): Promise<Business> => {
    const response = await client.patch<{ success: boolean; data: Business }>(
      '/business/contact',
      data
    );
    return response.data.data;
  },

  setPaymentResponsible: async (data: {
    businessId: string;
    userId: string;
  }): Promise<{ success: boolean; newResponsible: any }> => {
    const response = await client.patch<{
      success: boolean;
      data: { success: boolean; newResponsible: any };
    }>('/business/payment-responsible', data);
    return response.data.data;
  },
};
