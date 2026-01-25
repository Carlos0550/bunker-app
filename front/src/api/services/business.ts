import client from "../client";

export interface Multiplier {
  id: string;
  name: string;
  value: number; 
  isActive: boolean;
  paymentMethods: string[]; 
  installmentsCondition?: string; 
}

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
      "/business/contact",
      data
    );
    return response.data.data;
  },

  updateBusinessData: async (data: {
    businessId: string;
    name?: string;
    address?: string;
  }): Promise<string> => {
    const response = await client.patch<{ success: boolean; message: string }>(
      "/business/data",
      data
    );
    return response.data.message;
  },

  setPaymentResponsible: async (data: {
    businessId: string;
    userId: string;
  }): Promise<{ success: boolean; newResponsible: any }> => {
    const response = await client.patch<{
      success: boolean;
      data: { success: boolean; newResponsible: any };
    }>("/business/payment-responsible", data);
    return response.data.data;
  },

  getMultipliers: async (): Promise<Multiplier[]> => {
    const res = await client.get<{ success: boolean; data: Multiplier[] }>(
      "/business/multipliers"
    );
    return res.data.data;
  },

  updateMultipliers: async (
    multipliers: Multiplier[]
  ): Promise<Multiplier[]> => {
    const res = await client.patch<{ success: boolean; data: Multiplier[] }>(
      "/business/multipliers",
      { multipliers }
    );
    return res.data.data;
  },
};
