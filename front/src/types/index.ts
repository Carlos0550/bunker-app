export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  image?: string;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalPurchases: number;
  balance: number;
  createdAt: Date;
}

export interface Sale {
  id: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: Date;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
  todaySales: number;
  todayRevenue: number;
  monthlyGrowth: number;

}

export interface CartItem extends SaleItem {
  productId: string;
}


export interface User {
  id: string;
  name: string;
  email: string;
  role: number; 
  permissions: string[]; 
  profilePhoto?: string;
  businessId?: string;
}


export enum Permission {
  POS = 'POS',
  PRODUCTOS = 'PRODUCTOS',
  VENTAS = 'VENTAS',
  CLIENTES = 'CLIENTES',
  REPORTES = 'REPORTES',
  CONFIGURACION = 'CONFIGURACION',
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  businessName: string;
  businessAddress: string;
  businessPhone?: string;
  businessEmail?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface BusinessPlan {
  name: string
  price: number;
  features: string[];
}

export interface BusinessData {
  id: string;
  name: string;
  address: string;
  contact_phone: string;
  contact_email: string;
  business_page: string;
  businessPlan: BusinessPlan;
  createdAt: Date;
  updatedAt: Date;
}