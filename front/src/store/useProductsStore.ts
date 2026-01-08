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
    payment_terms?: string;   // "30 días", "contado"
    delivery_days?: number;  // demora promedio
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
    sku?: string;              // Código interno
    supplier_id?: string;     // Proveedor
    cost_price?: number;      // Precio de costo
    sale_price?: number;      // Precio de venta
    min_stock?: number;       // Stock mínimo
    reserved_stock?: number; // Reservas
    notes?: string;
    system_message?: string;
    multipliers: Record<string, number>;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

