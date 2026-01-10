import { prisma } from "@/config/db";
import { Prisma, AccountStatus, PaymentMethod, SaleStatus } from "@prisma/client";
import createHttpError from "http-errors";

interface CreateCustomerData {
  identifier: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface BusinessCustomerData {
  creditLimit?: number;
  notes?: string;
}

class CustomerService {
  /**
   * Crear o vincular un cliente a un negocio
   */
  async createOrLinkCustomer(
    businessId: string,
    customerData: CreateCustomerData,
    businessCustomerData?: BusinessCustomerData
  ) {
    // Buscar si el cliente ya existe globalmente
    let customer = await prisma.customer.findUnique({
      where: { identifier: customerData.identifier },
    });

    // Si no existe, crearlo
    if (!customer) {
      customer = await prisma.customer.create({
        data: customerData,
      });
    }

    // Verificar si ya está vinculado al negocio
    const existingLink = await prisma.businessCustomer.findUnique({
      where: {
        businessId_customerId: {
          businessId,
          customerId: customer.id,
        },
      },
    });

    if (existingLink) {
      throw createHttpError(409, "Este cliente ya está registrado en su negocio");
    }

    // Vincular al negocio
    const businessCustomer = await prisma.businessCustomer.create({
      data: {
        businessId,
        customerId: customer.id,
        creditLimit: businessCustomerData?.creditLimit,
        notes: businessCustomerData?.notes,
      },
      include: {
        customer: true,
      },
    });

    return businessCustomer;
  }

  /**
   * Obtener clientes del negocio
   */
  async getBusinessCustomers(
    businessId: string,
    search?: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.BusinessCustomerWhereInput = { businessId };

    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { identifier: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [businessCustomers, total] = await Promise.all([
      prisma.businessCustomer.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          currentAccounts: {
            where: { status: { not: AccountStatus.PAID } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.businessCustomer.count({ where }),
    ]);

    // Calcular totales de deuda por cliente
    const customersWithDebt = businessCustomers.map((bc) => ({
      ...bc,
      totalDebt: bc.currentAccounts.reduce((acc, ca) => acc + ca.currentBalance, 0),
      activeAccounts: bc.currentAccounts.length,
    }));

    return {
      data: customersWithDebt,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener detalle de un cliente del negocio
   */
  async getBusinessCustomerDetail(businessCustomerId: string, businessId: string) {
    const businessCustomer = await prisma.businessCustomer.findFirst({
      where: { id: businessCustomerId, businessId },
      include: {
        customer: true,
        currentAccounts: {
          include: {
            sale: {
              include: { items: true },
            },
            payments: {
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!businessCustomer) {
      throw createHttpError(404, "Cliente no encontrado");
    }

    const totalDebt = businessCustomer.currentAccounts.reduce(
      (acc, ca) => acc + (ca.status !== AccountStatus.PAID ? ca.currentBalance : 0),
      0
    );

    const totalPaid = businessCustomer.currentAccounts.reduce(
      (acc, ca) => acc + (ca.originalAmount - ca.currentBalance),
      0
    );

    return {
      ...businessCustomer,
      totalDebt,
      totalPaid,
    };
  }

  /**
   * Actualizar datos del cliente en el negocio
   */
  async updateBusinessCustomer(
    businessCustomerId: string,
    businessId: string,
    data: BusinessCustomerData
  ) {
    const businessCustomer = await prisma.businessCustomer.findFirst({
      where: { id: businessCustomerId, businessId },
    });

    if (!businessCustomer) {
      throw createHttpError(404, "Cliente no encontrado");
    }

    return prisma.businessCustomer.update({
      where: { id: businessCustomerId },
      data,
      include: { customer: true },
    });
  }

  // ==================== CUENTAS CORRIENTES ====================

  /**
   * Obtener cuentas corrientes del negocio
   */
  async getCurrentAccounts(
    businessId: string,
    status?: AccountStatus,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.CurrentAccountWhereInput = {
      businessCustomer: { businessId },
    };

    if (status) {
      where.status = status;
    }

    const [accounts, total] = await Promise.all([
      prisma.currentAccount.findMany({
        where,
        skip,
        take: limit,
        include: {
          businessCustomer: {
            include: { customer: true },
          },
          sale: {
            include: { items: true },
          },
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.currentAccount.count({ where }),
    ]);

    return {
      data: accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Registrar un pago/abono a una cuenta corriente
   */
  async registerPayment(
    currentAccountId: string,
    businessId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ) {
    const currentAccount = await prisma.currentAccount.findFirst({
      where: {
        id: currentAccountId,
        businessCustomer: { businessId },
      },
      include: {
        sale: true,
      },
    });

    if (!currentAccount) {
      throw createHttpError(404, "Cuenta corriente no encontrada");
    }

    if (currentAccount.status === AccountStatus.PAID) {
      throw createHttpError(400, "Esta cuenta ya está pagada");
    }

    if (amount <= 0) {
      throw createHttpError(400, "El monto debe ser mayor a 0");
    }

    if (amount > currentAccount.currentBalance) {
      throw createHttpError(
        400,
        `El monto excede el saldo pendiente de $${currentAccount.currentBalance}`
      );
    }

    const newBalance = currentAccount.currentBalance - amount;
    const isPaid = newBalance <= 0;

    // Transacción para registrar el pago
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el registro de pago
      const payment = await tx.accountPayment.create({
        data: {
          currentAccountId,
          amount,
          paymentMethod,
          notes,
        },
      });

      // 2. Actualizar el saldo de la cuenta
      const updatedAccount = await tx.currentAccount.update({
        where: { id: currentAccountId },
        data: {
          currentBalance: newBalance,
          status: isPaid ? AccountStatus.PAID : AccountStatus.PARTIAL,
        },
      });

      // 3. Si está pagada completamente, actualizar la venta y descontar stock
      if (isPaid && currentAccount.sale) {
        // Actualizar estado de la venta a completada
        await tx.sale.update({
          where: { id: currentAccount.sale.id },
          data: { status: SaleStatus.COMPLETED },
        });

        // Descontar stock de los productos
        const saleItems = await tx.saleItem.findMany({
          where: { saleId: currentAccount.sale.id },
        });

        for (const item of saleItems) {
          if (item.productId) {
            await tx.products.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
              },
            });
          }
        }
      }

      return { payment, updatedAccount };
    });

    return {
      ...result,
      isPaid,
      message: isPaid
        ? "Cuenta pagada completamente. La venta ahora impacta en las métricas."
        : `Abono registrado. Saldo pendiente: $${newBalance}`,
    };
  }

  /**
   * Obtener historial de pagos de una cuenta
   */
  async getAccountPayments(currentAccountId: string, businessId: string) {
    const currentAccount = await prisma.currentAccount.findFirst({
      where: {
        id: currentAccountId,
        businessCustomer: { businessId },
      },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!currentAccount) {
      throw createHttpError(404, "Cuenta corriente no encontrada");
    }

    return currentAccount.payments;
  }

  /**
   * Obtener resumen de cuentas corrientes del negocio
   */
  async getAccountsSummary(businessId: string) {
    const accounts = await prisma.currentAccount.findMany({
      where: {
        businessCustomer: { businessId },
      },
      include: {
        businessCustomer: {
          include: { customer: true },
        },
      },
    });

    const summary = {
      totalAccounts: accounts.length,
      pendingAccounts: accounts.filter((a) => a.status === AccountStatus.PENDING).length,
      partialAccounts: accounts.filter((a) => a.status === AccountStatus.PARTIAL).length,
      paidAccounts: accounts.filter((a) => a.status === AccountStatus.PAID).length,
      totalDebt: accounts
        .filter((a) => a.status !== AccountStatus.PAID)
        .reduce((acc, a) => acc + a.currentBalance, 0),
      totalOriginal: accounts.reduce((acc, a) => acc + a.originalAmount, 0),
    };

    // Top 5 clientes con más deuda
    const customerDebts = new Map<string, { customer: any; debt: number }>();
    for (const account of accounts) {
      if (account.status !== AccountStatus.PAID) {
        const customerId = account.businessCustomer.customerId;
        const existing = customerDebts.get(customerId);
        if (existing) {
          existing.debt += account.currentBalance;
        } else {
          customerDebts.set(customerId, {
            customer: account.businessCustomer.customer,
            debt: account.currentBalance,
          });
        }
      }
    }

    const topDebtors = Array.from(customerDebts.values())
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 5);

    return {
      ...summary,
      topDebtors,
    };
  }
}

export const customerService = new CustomerService();
