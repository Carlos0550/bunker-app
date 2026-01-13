import { prisma } from "@/config/db";
import {
  Prisma,
  SaleStatus,
  PaymentMethod,
  DiscountType,
  ProductState,
  ManualProductStatus,
} from "@prisma/client";
import createHttpError from "http-errors";
interface SaleItemInput {
  productId?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  isManual?: boolean;
}
interface CreateSaleData {
  customerId?: string;
  items: SaleItemInput[];
  taxRate?: number;
  discountType?: DiscountType;
  discountValue?: number;
  paymentMethod: PaymentMethod;
  isCredit?: boolean;
  notes?: string;
}
interface ManualProductInput {
  originalText: string;
  name: string;
  quantity: number;
  price: number;
}
interface SaleFilters {
  startDate?: Date;
  endDate?: Date;
  status?: SaleStatus;
  customerId?: string;
  isCredit?: boolean;
  paymentMethod?: PaymentMethod;
}
interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
class SaleService {
  private async generateSaleNumber(businessId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const startOfMonth = new Date(year, today.getMonth(), 1);
    const count = await prisma.sale.count({
      where: {
        businessId,
        createdAt: { gte: startOfMonth },
      },
    });
    return `VTA-${year}${month}-${String(count + 1).padStart(4, "0")}`;
  }
  async createSale(businessId: string, userId: string, data: CreateSaleData) {
    let subtotal = 0;
    const itemsData: Prisma.SaleItemCreateWithoutSaleInput[] = [];
    for (const item of data.items) {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      if (!item.isManual && item.productId) {
        const product = await prisma.products.findFirst({
          where: {
            id: item.productId,
            businessId,
            state: { not: ProductState.DELETED },
          },
        });
        if (!product) {
          throw createHttpError(404, `Producto no encontrado: ${item.productName}`);
        }
        if (product.stock < item.quantity) {
          throw createHttpError(
            400,
            `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`
          );
        }
      }
      itemsData.push({
        ...(item.productId && { product: { connect: { id: item.productId } } }),
        productName: item.productName,
        productSku: item.productSku || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        isManual: item.isManual || false,
      });
    }
    let discountAmount = 0;
    if (data.discountValue && data.discountType) {
      if (data.discountType === DiscountType.PERCENTAGE) {
        discountAmount = (subtotal * data.discountValue) / 100;
      } else {
        discountAmount = data.discountValue;
      }
    }
    const taxRate = data.taxRate ?? 0.16;
    const taxAmount = (subtotal - discountAmount) * taxRate;
    const total = subtotal - discountAmount + taxAmount;
    const saleNumber = await this.generateSaleNumber(businessId);
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          businessId,
          userId,
          customerId: data.customerId || null,
          subtotal,
          taxRate,
          taxAmount,
          discountType: data.discountType || null,
          discountValue: data.discountValue || null,
          total,
          // Si es crédito, usar CREDIT como método de pago, sino usar el método proporcionado
          paymentMethod: data.isCredit ? PaymentMethod.CREDIT : data.paymentMethod,
          status: data.isCredit ? SaleStatus.PENDING : SaleStatus.COMPLETED,
          isCredit: data.isCredit || false,
          notes: data.notes || null,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
          customer: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      if (!data.isCredit) {
        for (const item of data.items) {
          if (!item.isManual && item.productId) {
            await tx.products.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
              },
            });
            const updatedProduct = await tx.products.findUnique({
              where: { id: item.productId },
            });
            if (updatedProduct && updatedProduct.stock <= 0) {
              await tx.products.update({
                where: { id: item.productId },
                data: { state: ProductState.OUT_OF_STOCK },
              });
            }
          }
        }
      }
      if (data.isCredit && data.customerId) {
        let businessCustomer = await tx.businessCustomer.findUnique({
          where: {
            businessId_customerId: {
              businessId,
              customerId: data.customerId,
            },
          },
        });
        if (!businessCustomer) {
          businessCustomer = await tx.businessCustomer.create({
            data: {
              businessId,
              customerId: data.customerId,
            },
          });
        }
        await tx.currentAccount.create({
          data: {
            businessCustomerId: businessCustomer.id,
            saleId: newSale.id,
            originalAmount: total,
            currentBalance: total,
            status: "PENDING",
          },
        });
      }
      return newSale;
    });
    return sale;
  }
  async getSales(
    businessId: string,
    filters: SaleFilters = {},
    pagination: PaginationOptions = {}
  ) {
    const { startDate, endDate, status, customerId, isCredit, paymentMethod } = filters;
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;
    const where: Prisma.SaleWhereInput = { businessId };
    if (startDate) {
      where.createdAt = { ...where.createdAt as any, gte: startDate };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt as any, lte: endDate };
    }
    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (isCredit !== undefined) {
      where.isCredit = isCredit;
    }
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: true,
          customer: true,
          user: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.sale.count({ where }),
    ]);
    return {
      data: sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getSaleById(saleId: string, businessId: string) {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, businessId },
      include: {
        items: {
          include: { product: true },
        },
        customer: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        currentAccount: {
          include: { payments: true },
        },
      },
    });
    if (!sale) {
      throw createHttpError(404, "Venta no encontrada");
    }
    return sale;
  }
  async cancelSale(saleId: string, businessId: string) {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, businessId },
      include: { items: true },
    });
    if (!sale) {
      throw createHttpError(404, "Venta no encontrada");
    }
    if (sale.status === SaleStatus.CANCELLED) {
      throw createHttpError(400, "La venta ya está cancelada");
    }
    await prisma.$transaction(async (tx) => {
      if (sale.status === SaleStatus.COMPLETED) {
        for (const item of sale.items) {
          if (item.productId) {
            await tx.products.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                state: ProductState.ACTIVE,
              },
            });
          }
        }
      }
      await tx.sale.update({
        where: { id: saleId },
        data: { status: SaleStatus.CANCELLED },
      });
      await tx.currentAccount.updateMany({
        where: { saleId },
        data: { status: "PAID", currentBalance: 0 },
      });
    });
    return { message: "Venta cancelada correctamente" };
  }
  async createManualProduct(businessId: string, data: ManualProductInput) {
    const similarProducts = await prisma.products.findMany({
      where: {
        businessId,
        state: { not: ProductState.DELETED },
        OR: [
          { name: { contains: data.name, mode: "insensitive" } },
          { name: { contains: data.name.split(" ")[0], mode: "insensitive" } },
        ],
      },
      take: 5,
    });
    const suggestedProductId = similarProducts.length > 0 ? similarProducts[0].id : null;
    const manualProduct = await prisma.manualProduct.create({
      data: {
        businessId,
        originalText: data.originalText,
        name: data.name,
        quantity: data.quantity,
        price: data.price,
        suggestedProductId,
        status: ManualProductStatus.PENDING,
      },
    });
    return {
      manualProduct,
      suggestions: similarProducts,
    };
  }
  async getManualProducts(businessId: string, status?: ManualProductStatus) {
    const where: Prisma.ManualProductWhereInput = { businessId };
    if (status) {
      where.status = status;
    }
    const manualProducts = await prisma.manualProduct.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    const productsWithSuggestions = await Promise.all(
      manualProducts.map(async (mp) => {
        const suggestions = await prisma.products.findMany({
          where: {
            businessId,
            state: { not: ProductState.DELETED },
            OR: [
              { name: { contains: mp.name, mode: "insensitive" } },
              { name: { contains: mp.name.split(" ")[0], mode: "insensitive" } },
            ],
          },
          take: 5,
        });
        return { ...mp, suggestions };
      })
    );
    return productsWithSuggestions;
  }
  async linkManualProduct(manualProductId: string, productId: string, businessId: string) {
    const manualProduct = await prisma.manualProduct.findFirst({
      where: { id: manualProductId, businessId },
    });
    if (!manualProduct) {
      throw createHttpError(404, "Producto manual no encontrado");
    }
    const product = await prisma.products.findFirst({
      where: { id: productId, businessId },
    });
    if (!product) {
      throw createHttpError(404, "Producto no encontrado");
    }
    await prisma.manualProduct.update({
      where: { id: manualProductId },
      data: {
        linkedProductId: productId,
        status: ManualProductStatus.LINKED,
      },
    });
    return { message: "Producto vinculado correctamente" };
  }
  async convertManualProduct(manualProductId: string, businessId: string, additionalData?: any) {
    const manualProduct = await prisma.manualProduct.findFirst({
      where: { id: manualProductId, businessId },
    });
    if (!manualProduct) {
      throw createHttpError(404, "Producto manual no encontrado");
    }
    const newProduct = await prisma.products.create({
      data: {
        businessId,
        name: manualProduct.name,
        stock: 0,
        sale_price: manualProduct.price,
        min_stock: 5,
        ...additionalData,
      },
    });
    await prisma.manualProduct.update({
      where: { id: manualProductId },
      data: {
        linkedProductId: newProduct.id,
        status: ManualProductStatus.CONVERTED,
      },
    });
    return newProduct;
  }
  async ignoreManualProduct(manualProductId: string, businessId: string) {
    const manualProduct = await prisma.manualProduct.findFirst({
      where: { id: manualProductId, businessId },
    });
    if (!manualProduct) {
      throw createHttpError(404, "Producto manual no encontrado");
    }
    await prisma.manualProduct.update({
      where: { id: manualProductId },
      data: { status: ManualProductStatus.IGNORED },
    });
    return { message: "Producto ignorado" };
  }
  async updateManualProduct(
    manualProductId: string,
    businessId: string,
    data: { name?: string; quantity?: number; price?: number; status?: ManualProductStatus }
  ) {
    const manualProduct = await prisma.manualProduct.findFirst({
      where: { id: manualProductId, businessId },
    });
    if (!manualProduct) {
      throw createHttpError(404, "Producto manual no encontrado");
    }
    const updated = await prisma.manualProduct.update({
      where: { id: manualProductId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.status && { status: data.status }),
      },
    });
    return updated;
  }
  parseManualProductText(text: string): ManualProductInput | null {
    const regex = /^(\d+)\s+(.+?)\s+(\d+(?:\.\d{2})?)$/;
    const match = text.trim().match(regex);
    if (!match) {
      return null;
    }
    const [, quantityStr, name, priceStr] = match;
    return {
      originalText: text,
      quantity: parseInt(quantityStr, 10),
      name: name.trim(),
      price: parseFloat(priceStr),
    };
  }
}
export const saleService = new SaleService();
