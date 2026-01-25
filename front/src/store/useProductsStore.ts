export const PRODUCT_STATES = {
  ACTIVE: 'active',
  OUT_OF_STOCK: 'out_of_stock',
  DISABLED: 'disabled',
  DELETED: 'deleted',
} as const;

export type ProductState = typeof PRODUCT_STATES[keyof typeof PRODUCT_STATES];

export interface Provider{
    id: string;
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    payment_terms?: string;   
    delivery_days?: number;  
    minimum_order?: number;
    status: 'active' | 'inactive' | 'blocked';
}

export interface Product{
    id: string;
    name: string;
    stock: number;
    bar_code?: string;
    image?: string;
    category_id?: string;
    description?: string;
    state: ProductState;
    sku?: string;              
    supplier_id?: string;     
    cost_price?: number;      
    sale_price?: number;      
    min_stock?: number;       
    reserved_stock?: number; 
    notes?: string;
    system_message?: string;
    multipliers: Record<string, number>;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

