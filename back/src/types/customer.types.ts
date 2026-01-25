export interface CreateCustomerData {
  identifier: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface BusinessCustomerData {
  creditLimit?: number;
  notes?: string;
}
