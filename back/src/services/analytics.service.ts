import { prisma } from "@/config/db";
import { SaleStatus, ProductState, AccountStatus } from "@prisma/client";
type Period = "today" | "yesterday" | "week" | "month" | "custom";
interface DateRange {
  startDate: Date;
  endDate: Date;
}
class AnalyticsService {
  private getDateRange(period: Period, customStart?: Date, customEnd?: Date): DateRange {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (period) {
      case "today":
        return {
          startDate: startOfDay,
          endDate: now,
        };
      case "yesterday":
        const yesterday = new Date(startOfDay);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: yesterday,
          endDate: startOfDay,
        };
      case "week":
        const weekAgo = new Date(startOfDay);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
          startDate: weekAgo,
          endDate: now,
        };
      case "month":
        const monthAgo = new Date(startOfDay);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return {
          startDate: monthAgo,
          endDate: now,
        };
      case "custom":
        if (!customStart || !customEnd) {
          throw new Error("Se requieren fechas de inicio y fin para período personalizado");
        }
        return {
          startDate: customStart,
          endDate: customEnd,
        };
      default:
        return {
          startDate: startOfDay,
          endDate: now,
        };
    }
  }
  async getSalesSummary(businessId: string, period: Period, customStart?: Date, customEnd?: Date) {
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);
    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        createdAt: { gte: startDate, lte: endDate },
        status: SaleStatus.COMPLETED,
        OR: [
          { isCredit: false },
          {
            isCredit: true,
            currentAccount: { status: AccountStatus.PAID },
          },
        ],
      },
      include: {
        items: true,
      },
    });
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
    const totalItems = sales.reduce((acc, sale) => 
      acc + sale.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0
    );
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    // Para ventas de contado, usar el método de pago de la venta
    const cashSales = await prisma.sale.groupBy({
      by: ["paymentMethod"],
      where: {
        businessId,
        createdAt: { gte: startDate, lte: endDate },
        status: SaleStatus.COMPLETED,
        isCredit: false,
      },
      _count: true,
      _sum: { total: true },
    });

    // Para ventas a crédito pagadas, usar los métodos de pago de los abonos
    const creditPayments = await prisma.accountPayment.groupBy({
      by: ["paymentMethod"],
      where: {
        currentAccount: {
          businessCustomer: { businessId },
          sale: {
            createdAt: { gte: startDate, lte: endDate },
            status: SaleStatus.COMPLETED,
            isCredit: true,
          },
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Combinar ambos resultados
    const paymentMethodMap = new Map<string, { count: number; total: number }>();

    // Agregar ventas de contado
    cashSales.forEach((s) => {
      paymentMethodMap.set(s.paymentMethod, {
        count: s._count,
        total: s._sum.total || 0,
      });
    });

    // Agregar pagos de crédito
    creditPayments.forEach((p) => {
      const existing = paymentMethodMap.get(p.paymentMethod);
      if (existing) {
        existing.total += p._sum.amount || 0;
        // No incrementar count porque ya contamos la venta
      } else {
        paymentMethodMap.set(p.paymentMethod, {
          count: 0, // No contar como venta nueva, solo el monto
          total: p._sum.amount || 0,
        });
      }
    });

    const salesByPaymentMethod = Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
      paymentMethod: method,
      count: data.count,
      total: data.total,
    }));

    return {
      period: { startDate, endDate },
      totalSales,
      totalRevenue,
      totalItems,
      averageTicket,
      salesByPaymentMethod,
    };
  }
  async getTopProducts(businessId: string, limit: number = 10, period?: Period) {
    const dateFilter = period ? this.getDateRange(period) : null;
    const topProducts = await prisma.saleItem.groupBy({
      by: ["productId", "productName"],
      where: {
        sale: {
          businessId,
          status: SaleStatus.COMPLETED,
          ...(dateFilter && { createdAt: { gte: dateFilter.startDate, lte: dateFilter.endDate } }),
        },
        productId: { not: null },
      },
      _count: true,
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: { quantity: "desc" },
      },
      take: limit,
    });
    const productIds = topProducts
      .map((p) => p.productId)
      .filter((id): id is string => id !== null);
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sale_price: true, stock: true, image: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    return topProducts.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      salesCount: p._count,
      quantitySold: p._sum.quantity || 0,
      revenue: p._sum.totalPrice || 0,
      product: p.productId ? productMap.get(p.productId) : null,
    }));
  }
  async getLeastSellingProducts(businessId: string, limit: number = 10, period?: Period) {
    const dateFilter = period ? this.getDateRange(period) : null;
    const allProducts = await prisma.products.findMany({
      where: {
        businessId,
        state: ProductState.ACTIVE,
      },
      select: { id: true, name: true, sale_price: true, stock: true, createdAt: true },
    });
    const salesByProduct = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: {
          businessId,
          status: SaleStatus.COMPLETED,
          ...(dateFilter && { createdAt: { gte: dateFilter.startDate, lte: dateFilter.endDate } }),
        },
        productId: { not: null },
      },
      _sum: { quantity: true },
    });
    const salesMap = new Map(salesByProduct.map((s) => [s.productId, s._sum.quantity || 0]));
    const productsWithSales = allProducts.map((p) => ({
      ...p,
      quantitySold: salesMap.get(p.id) || 0,
    }));
    productsWithSales.sort((a, b) => a.quantitySold - b.quantitySold);
    return productsWithSales.slice(0, limit);
  }
  async getLowStockProducts(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { lowStockThreshold: true },
    });
    const defaultThreshold = business?.lowStockThreshold || 10;
    const products = await prisma.products.findMany({
      where: {
        businessId,
        state: ProductState.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        min_stock: true,
        sale_price: true,
        image: true,
      },
    });
    return products
      .filter((p) => p.stock <= (p.min_stock || defaultThreshold))
      .map((p) => ({
        ...p,
        threshold: p.min_stock || defaultThreshold,
        deficit: (p.min_stock || defaultThreshold) - p.stock,
      }))
      .sort((a, b) => a.stock - b.stock);
  }
  async getProductPerformance(businessId: string, productId: string) {
    const product = await prisma.products.findFirst({
      where: { id: productId, businessId },
    });
    if (!product) {
      throw new Error("Producto no encontrado");
    }
    const periods = ["today", "week", "month"] as const;
    const salesByPeriod: Record<string, any> = {};
    for (const period of periods) {
      const { startDate, endDate } = this.getDateRange(period);
      const sales = await prisma.saleItem.aggregate({
        where: {
          productId,
          sale: {
            businessId,
            status: SaleStatus.COMPLETED,
            createdAt: { gte: startDate, lte: endDate },
          },
        },
        _sum: { quantity: true, totalPrice: true },
        _count: true,
      });
      salesByPeriod[period] = {
        quantity: sales._sum.quantity || 0,
        revenue: sales._sum.totalPrice || 0,
        transactionCount: sales._count,
      };
    }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const totalSalesLast30Days = await prisma.saleItem.aggregate({
      where: {
        productId,
        sale: {
          businessId,
          status: SaleStatus.COMPLETED,
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      _sum: { quantity: true, totalPrice: true },
    });
    return {
      product,
      salesByPeriod,
      totalSalesLast30Days: {
        quantity: totalSalesLast30Days._sum.quantity || 0,
        totalPrice: totalSalesLast30Days._sum.totalPrice || 0,
      },
    };
  }
  async getDashboardStats(businessId: string) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const todaySales = await prisma.sale.aggregate({
      where: {
        businessId,
        createdAt: { gte: startOfToday },
        status: SaleStatus.COMPLETED,
      },
      _count: true,
      _sum: { total: true },
    });
    const yesterdaySales = await prisma.sale.aggregate({
      where: {
        businessId,
        createdAt: { gte: startOfYesterday, lt: startOfToday },
        status: SaleStatus.COMPLETED,
      },
      _count: true,
      _sum: { total: true },
    });
    const monthSales = await prisma.sale.aggregate({
      where: {
        businessId,
        createdAt: { gte: startOfMonth },
        status: SaleStatus.COMPLETED,
      },
      _count: true,
      _sum: { total: true },
    });
    const lastMonthSales = await prisma.sale.aggregate({
      where: {
        businessId,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: SaleStatus.COMPLETED,
      },
      _sum: { total: true },
    });
    const totalProducts = await prisma.products.count({
      where: { businessId, state: { not: ProductState.DELETED } },
    });
    const lowStockProducts = await this.getLowStockProducts(businessId);
    const todayRevenue = todaySales._sum.total || 0;
    const yesterdayRevenue = yesterdaySales._sum.total || 0;
    const dailyChange = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : todayRevenue > 0 ? 100 : 0;
    const currentMonthRevenue = monthSales._sum.total || 0;
    const lastMonthRevenue = lastMonthSales._sum.total || 0;
    const monthlyGrowth = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : currentMonthRevenue > 0 ? 100 : 0;
    return {
      todaySales: todaySales._count,
      todayRevenue,
      dailyChange: Math.round(dailyChange * 10) / 10,
      totalProducts,
      lowStockProducts: lowStockProducts.length,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      totalSales: monthSales._count,
      totalRevenue: currentMonthRevenue,
    };
  }
  async getSalesChart(businessId: string, period: Period = "week") {
    const data = [];
    const today = new Date();
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    if (period === "today") {
      // Mostrar ventas por hora del día actual
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const currentHour = today.getHours();
      
      for (let hour = 0; hour <= currentHour; hour++) {
        const startHour = new Date(startOfToday);
        startHour.setHours(hour, 0, 0, 0);
        const endHour = new Date(startOfToday);
        endHour.setHours(hour + 1, 0, 0, 0);

        const sales = await prisma.sale.aggregate({
          where: {
            businessId,
            createdAt: { gte: startHour, lt: endHour },
            status: SaleStatus.COMPLETED,
          },
          _sum: { total: true },
        });

        data.push({
          name: `${hour.toString().padStart(2, '0')}:00`,
          date: startHour.toISOString(),
          ventas: sales._sum.total || 0,
        });
      }
    } else if (period === "yesterday") {
      // Mostrar ventas por hora del día anterior
      const startOfYesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      
      for (let hour = 0; hour < 24; hour++) {
        const startHour = new Date(startOfYesterday);
        startHour.setHours(hour, 0, 0, 0);
        const endHour = new Date(startOfYesterday);
        endHour.setHours(hour + 1, 0, 0, 0);

        const sales = await prisma.sale.aggregate({
          where: {
            businessId,
            createdAt: { gte: startHour, lt: endHour },
            status: SaleStatus.COMPLETED,
          },
          _sum: { total: true },
        });

        data.push({
          name: `${hour.toString().padStart(2, '0')}:00`,
          date: startHour.toISOString(),
          ventas: sales._sum.total || 0,
        });
      }
    } else if (period === "week") {
      // Mostrar últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const sales = await prisma.sale.aggregate({
          where: {
            businessId,
            createdAt: { gte: startOfDay, lt: endOfDay },
            status: SaleStatus.COMPLETED,
          },
          _sum: { total: true },
        });

        data.push({
          name: dayNames[date.getDay()],
          date: startOfDay.toISOString().split("T")[0],
          ventas: sales._sum.total || 0,
        });
      }
    } else if (period === "month") {
      // Mostrar últimos 30 días agrupados por semana (o cada 5 días para más detalle)
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const sales = await prisma.sale.aggregate({
          where: {
            businessId,
            createdAt: { gte: startOfDay, lt: endOfDay },
            status: SaleStatus.COMPLETED,
          },
          _sum: { total: true },
        });

        data.push({
          name: `${date.getDate()} ${monthNames[date.getMonth()]}`,
          date: startOfDay.toISOString().split("T")[0],
          ventas: sales._sum.total || 0,
        });
      }
    }

    return data;
  }

  // Mantener el método original para compatibilidad con el Dashboard
  async getWeeklySalesChart(businessId: string) {
    return this.getSalesChart(businessId, "week");
  }
  async getRecentSales(businessId: string, limit: number = 5) {
    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        status: SaleStatus.COMPLETED,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        customer: true,
        items: true,
        user: {
          select: { name: true },
        },
      },
    });
    return sales.map((sale) => ({
      id: sale.id,
      saleNumber: sale.saleNumber,
      customerName: sale.customer?.name || "Cliente General",
      total: sale.total,
      itemCount: sale.items.reduce((acc, item) => acc + item.quantity, 0),
      paymentMethod: sale.paymentMethod,
      createdAt: sale.createdAt,
      processedBy: sale.user?.name,
    }));
  }
}
export const analyticsService = new AnalyticsService();
