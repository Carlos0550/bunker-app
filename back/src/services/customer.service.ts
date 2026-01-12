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
  async createOrLinkCustomer(
    businessId: string,
    customerData: CreateCustomerData,
    businessCustomerData?: BusinessCustomerData
  ) {
    let customer = await prisma.customer.findUnique({
      where: { identifier: customerData.identifier },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: customerData,
      });
    }
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
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.accountPayment.create({
        data: {
          currentAccountId,
          amount,
          paymentMethod,
          notes,
        },
      });
      const updatedAccount = await tx.currentAccount.update({
        where: { id: currentAccountId },
        data: {
          currentBalance: newBalance,
          status: isPaid ? AccountStatus.PAID : AccountStatus.PARTIAL,
          ...(isPaid && { paidAt: new Date() }),
        },
      });
      if (isPaid && currentAccount.sale) {
        await tx.sale.update({
          where: { id: currentAccount.sale.id },
          data: { status: SaleStatus.COMPLETED },
        });
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
  async getCustomerMetrics(businessCustomerId: string, businessId: string) {
    const businessCustomer = await prisma.businessCustomer.findFirst({
      where: { id: businessCustomerId, businessId },
      include: {
        customer: true,
        currentAccounts: {
          include: {
            sale: true,
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
    const accounts = businessCustomer.currentAccounts;
    const paidAccounts = accounts.filter((a) => a.status === AccountStatus.PAID && a.paidAt);
    let averagePaymentDays: number | null = null;
    if (paidAccounts.length > 0) {
      const totalDays = paidAccounts.reduce((acc, account) => {
        const createdAt = new Date(account.createdAt);
        const paidAt = new Date(account.paidAt!);
        const diffTime = Math.abs(paidAt.getTime() - createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return acc + diffDays;
      }, 0);
      averagePaymentDays = Math.round(totalDays / paidAccounts.length);
    }
    const accountsByMonth: Record<string, typeof accounts> = {};
    for (const account of accounts) {
      const date = new Date(account.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!accountsByMonth[key]) {
        accountsByMonth[key] = [];
      }
      accountsByMonth[key].push(account);
    }
    const accountsByMonthArray = Object.entries(accountsByMonth)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([monthKey, monthAccounts]) => ({
        monthKey,
        accounts: monthAccounts,
      }));
    const totalDebt = accounts
      .filter((a) => a.status !== AccountStatus.PAID)
      .reduce((acc, a) => acc + a.currentBalance, 0);
    const totalPaid = accounts.reduce(
      (acc, a) => acc + (a.originalAmount - a.currentBalance),
      0
    );
    const paidOnTimeCount = paidAccounts.filter((account) => {
      const createdAt = new Date(account.createdAt);
      const paidAt = new Date(account.paidAt!);
      const diffTime = Math.abs(paidAt.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;
    return {
      customer: businessCustomer.customer,
      creditLimit: businessCustomer.creditLimit,
      notes: businessCustomer.notes,
      totalAccountsCount: accounts.length,
      paidAccountsCount: paidAccounts.length,
      pendingAccountsCount: accounts.filter((a) => a.status !== AccountStatus.PAID).length,
      averagePaymentDays,
      paidOnTimeCount,
      totalDebt,
      totalPaid,
      accountsByMonth: accountsByMonthArray,
    };
  }
}
export const customerService = new CustomerService();
