import { SaleStatus, PaymentMethod, DiscountType, ManualProductStatus } from "@prisma/client";

export interface SaleItemInput {
  productId?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  isManual?: boolean;
}

export interface CreateSaleData {
  customerId?: string;
  items: SaleItemInput[];
  taxRate?: number;
  discountType?: DiscountType;
  discountValue?: number;
  paymentMethod: PaymentMethod;
  isCredit?: boolean;
  notes?: string;
}

export interface ManualProductInput {
  originalText: string;
  name: string;
  quantity: number;
  price: number;
}

export interface SaleFilters {
  startDate?: Date;
  endDate?: Date;
  status?: SaleStatus;
  customerId?: string;
  isCredit?: boolean;
  paymentMethod?: PaymentMethod;
}

export interface UpdateManualProductData {
  name?: string;
  quantity?: number;
  price?: number;
  status?: ManualProductStatus;
}
