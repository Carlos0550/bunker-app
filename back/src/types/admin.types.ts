export interface CreatePlanData {
  name: string;
  price: number;
  description?: string;
  features?: string[];
}

export interface UpdatePlanData {
  name?: string;
  price?: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
}
