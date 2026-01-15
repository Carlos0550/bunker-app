import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { analyticsApi, SalesSummary, TopProduct, ChartDataPoint, RecentSale } from "@/api/services/analytics";
import { salesApi, Sale } from "@/api/services/sales";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Eye,
  Receipt,
  Clock,
  User,
  CreditCard,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = [
  "hsl(45, 100%, 51%)",  // Amarillo (primary)
  "hsl(142, 76%, 36%)",  // Verde
  "hsl(217, 91%, 60%)",  // Azul
  "hsl(0, 84%, 60%)",    // Rojo
  "hsl(280, 87%, 65%)",  // Morado
  "hsl(24, 95%, 53%)",   // Naranja
];

type Period = "today" | "yesterday" | "week" | "month";

export default function Reportes() {
  const [period, setPeriod] = useState<Period>("month");
  const [salesPage, setSalesPage] = useState(1);
  const [salesSearch, setSalesSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Queries
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: analyticsApi.getDashboardStats,
  });

  const { data: salesSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ["salesSummary", period],
    queryFn: () => analyticsApi.getSalesSummary(period),
  });

  const { data: topProducts, isLoading: loadingTopProducts } = useQuery({
    queryKey: ["topProducts", period],
    queryFn: () => analyticsApi.getTopProducts(10, period),
  });

  const { data: chartData, isLoading: loadingChart } = useQuery({
    queryKey: ["salesChart", period],
    queryFn: () => analyticsApi.getSalesChart(period),
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ["lowStockProducts"],
    queryFn: analyticsApi.getLowStockProducts,
  });

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ["salesHistory", salesPage],
    queryFn: () => salesApi.getSales({ page: salesPage, limit: 20 }),
  });

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  const paymentMethodData = (salesSummary?.salesByPaymentMethod || []).map((pm, index) => ({
    name: pm.paymentMethod === "CASH" ? "Efectivo" :
          pm.paymentMethod === "CARD" ? "Tarjeta" :
          pm.paymentMethod === "TRANSFER" ? "Transferencia" :
          pm.paymentMethod === "CREDIT" ? "Crédito" : "Otro",
    value: pm.total,
    count: pm.count,
    fill: COLORS[index % COLORS.length],
  })) || [];

  const filteredSales = salesData?.data.filter(sale =>
    sale.saleNumber.toLowerCase().includes(salesSearch.toLowerCase()) ||
    sale.customer?.name?.toLowerCase().includes(salesSearch.toLowerCase()) ||
    sale.user?.name?.toLowerCase().includes(salesSearch.toLowerCase())
  ) || [];

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case "today": return "Hoy";
      case "yesterday": return "Ayer";
      case "week": return "Esta Semana";
      case "month": return "Este Mes";
    }
  };

  const getChartSubtitle = (p: Period) => {
    switch (p) {
      case "today": return "Ventas por hora - Hoy";
      case "yesterday": return "Ventas por hora - Ayer";
      case "week": return "Últimos 7 días";
      case "month": return "Últimos 30 días";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500/20 text-green-400">Completada</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pendiente</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-500/20 text-red-400">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH": return "Efectivo";
      case "CARD": return "Tarjeta";
      case "TRANSFER": return "Transferencia";
      case "CREDIT": return "Crédito";
      default: return "Otro";
    }
  };

  const handleViewSale = async (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  return (
    <MainLayout title="Reportes">
      <div className="space-y-6 w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reportes y Análisis</h1>
            <p className="text-muted-foreground">
              Visualiza el rendimiento de tu negocio
            </p>
          </div>
          <div className="flex items-center gap-2" data-tour="reportes-period">
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="yesterday">Ayer</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetchStats()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-tour="reportes-stats">
          {loadingStats ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 sm:h-32" />
              ))}
            </>
          ) : (
            <>
              <div className="stat-card min-w-0">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Ventas del Mes</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground truncate">{stats?.totalSales || 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {(stats?.monthlyGrowth || 0) >= 0 ? (
                        <>
                          <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-success shrink-0" />
                          <span className="text-[10px] sm:text-xs text-success truncate">+{stats?.monthlyGrowth}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-destructive shrink-0" />
                          <span className="text-[10px] sm:text-xs text-destructive truncate">{stats?.monthlyGrowth}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-primary/20 shrink-0">
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="stat-card min-w-0">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Ingresos del Mes</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                      {formatCurrency(stats?.totalRevenue || 0)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {(stats?.monthlyGrowth || 0) >= 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-success shrink-0" />
                          <span className="text-[10px] sm:text-xs text-success truncate">Creciendo</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-destructive shrink-0" />
                          <span className="text-[10px] sm:text-xs text-destructive truncate">Decreciendo</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-success/20 shrink-0">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                  </div>
                </div>
              </div>

              <div className="stat-card min-w-0">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Ventas de Hoy</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground truncate">{stats?.todaySales || 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {(stats?.dailyChange || 0) >= 0 ? (
                        <>
                          <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-success shrink-0" />
                          <span className="text-[10px] sm:text-xs text-success truncate">+{stats?.dailyChange}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-destructive shrink-0" />
                          <span className="text-[10px] sm:text-xs text-destructive truncate">{stats?.dailyChange}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-blue-500/20 shrink-0">
                    <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="stat-card min-w-0">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Stock Bajo</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground truncate">{stats?.lowStockProducts || 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {(stats?.lowStockProducts || 0) > 0 ? (
                        <>
                          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-warning shrink-0" />
                          <span className="text-[10px] sm:text-xs text-warning truncate">Atención</span>
                        </>
                      ) : (
                        <span className="text-[10px] sm:text-xs text-success truncate">Todo en orden</span>
                      )}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-warning/20 shrink-0">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ventas" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide" data-tour="reportes-tabs">
            <TabsList className="bg-secondary/50 inline-flex w-max sm:w-auto min-w-full sm:min-w-0">
              <TabsTrigger value="ventas" className="text-sm sm:text-base px-3 sm:px-4 shrink-0">
                <span className="hidden sm:inline">Tendencia de Ventas</span>
                <span className="sm:hidden">Tendencia</span>
              </TabsTrigger>
              <TabsTrigger value="productos" className="text-sm sm:text-base px-3 sm:px-4 shrink-0">
                <span className="hidden sm:inline">Top Productos</span>
                <span className="sm:hidden">Productos</span>
              </TabsTrigger>
              <TabsTrigger value="metodos" className="text-sm sm:text-base px-3 sm:px-4 shrink-0">
                <span className="hidden sm:inline">Métodos de Pago</span>
                <span className="sm:hidden">Pagos</span>
              </TabsTrigger>
              <TabsTrigger value="historial" className="text-sm sm:text-base px-3 sm:px-4 shrink-0">
                <span className="hidden sm:inline">Historial de Ventas</span>
                <span className="sm:hidden">Historial</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tendencia de Ventas */}
          <TabsContent value="ventas">
            <div className="bunker-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Tendencia de Ventas</h3>
                  <p className="text-sm text-muted-foreground">{getChartSubtitle(period)}</p>
                </div>
                {chartData && chartData.length > 0 && (
                  <Badge variant="outline" className="border-success text-success">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {formatCurrency(chartData.reduce((acc, d) => acc + d.ventas, 0))} total
                  </Badge>
                )}
              </div>
              
              {loadingChart ? (
                <Skeleton className="h-[250px] sm:h-[400px]" />
              ) : chartData && chartData.length > 0 ? (
                <div className="h-[250px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVentasReport" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(45, 100%, 51%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(45, 100%, 51%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 22%)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(220, 18%, 15%)', 
                          border: '1px solid hsl(220, 15%, 22%)',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
                        formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="ventas" 
                        stroke="hsl(45, 100%, 51%)" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorVentasReport)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] sm:h-[400px] flex items-center justify-center text-muted-foreground">
                  No hay datos de ventas para mostrar
                </div>
              )}
            </div>
          </TabsContent>

          {/* Top Productos */}
          <TabsContent value="productos">
            <div className="bunker-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Productos Más Vendidos</h3>
                  <p className="text-sm text-muted-foreground">Top 10 por ingresos - {getPeriodLabel(period)}</p>
                </div>
              </div>
              
              {loadingTopProducts ? (
                <Skeleton className="h-[250px] sm:h-[400px]" />
              ) : topProducts && topProducts.length > 0 ? (
                <div className="h-[250px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={topProducts.map(p => ({ name: p.productName, revenue: p.revenue, quantity: p.quantitySold }))} 
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 22%)" horizontal={false} />
                      <XAxis 
                        type="number"
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <YAxis 
                        type="category"
                        dataKey="name"
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }}
                        width={180}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(220, 18%, 15%)', 
                          border: '1px solid hsl(220, 15%, 22%)',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : value,
                          name === 'revenue' ? 'Ingresos' : 'Cantidad'
                        ]}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="hsl(45, 100%, 51%)" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] sm:h-[400px] flex items-center justify-center text-muted-foreground">
                  No hay datos de productos para mostrar
                </div>
              )}
            </div>
          </TabsContent>

          {/* Métodos de Pago */}
          <TabsContent value="metodos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bunker-card p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Ventas por Método de Pago</h3>
                  <p className="text-sm text-muted-foreground">{getPeriodLabel(period)}</p>
                </div>
                
                {loadingSummary ? (
                  <Skeleton className="h-[250px] sm:h-[300px]" />
                ) : paymentMethodData.length > 0 ? (
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(220, 18%, 15%)', 
                            border: '1px solid hsl(220, 15%, 22%)',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'Total']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos de pagos para mostrar
                  </div>
                )}
              </div>

              <div className="bunker-card p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Detalle por Método</h3>
                  <p className="text-sm text-muted-foreground">Resumen de {getPeriodLabel(period).toLowerCase()}</p>
                </div>
                
                {loadingSummary ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : paymentMethodData.length > 0 ? (
                  <div className="space-y-4">
                    {paymentMethodData.map((method) => {
                      const total = paymentMethodData.reduce((acc, m) => acc + m.value, 0);
                      const percentage = total > 0 ? (method.value / total) * 100 : 0;
                      
                      return (
                        <div key={method.name} className="flex items-center gap-2 sm:gap-4">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: method.fill }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-1">
                              <span className="font-medium text-foreground text-sm sm:text-base truncate">{method.name}</span>
                              <div className="flex items-center gap-2 sm:text-right">
                                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{method.count} ventas</span>
                                <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
                                  {formatCurrency(method.value)}
                                </span>
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: method.fill
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Resumen */}
                    <div className="pt-4 mt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">Total {getPeriodLabel(period)}</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(salesSummary?.totalRevenue || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                        <span>{salesSummary?.totalSales || 0} ventas</span>
                        <span>Ticket promedio: {formatCurrency(salesSummary?.averageTicket || 0)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos de pagos para mostrar
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Historial de Ventas */}
          <TabsContent value="historial">
            <div className="bunker-card p-4 sm:p-6 w-full max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Historial de Ventas</h3>
                  <p className="text-sm text-muted-foreground">
                    Todas las transacciones realizadas
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por # venta, cliente..."
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loadingSales ? (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : filteredSales.length > 0 ? (
                <>
                  {/* Vista móvil: Cards */}
                  <div className="block md:hidden space-y-3 w-full max-w-full overflow-hidden">
                    {filteredSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="bunker-card p-3 border border-border/50 w-full max-w-full overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2 w-full">
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="font-medium text-xs sm:text-sm font-mono truncate">#{sale.saleNumber}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {getStatusBadge(sale.status)}
                                {sale.isCredit && (
                                  <Badge variant="outline" className="text-xs shrink-0">Fiado</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              <div className="flex items-center gap-1 min-w-0">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span className="truncate">{format(new Date(sale.createdAt), "dd MMM yyyy HH:mm", { locale: es })}</span>
                              </div>
                              {sale.customer?.name && (
                                <div className="flex items-center gap-1 min-w-0">
                                  <User className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{sale.customer.name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 min-w-0">
                                <CreditCard className="h-3 w-3 shrink-0" />
                                <span className="truncate">{getPaymentMethodLabel(sale.paymentMethod)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <p className="font-semibold text-sm whitespace-nowrap">{formatCurrency(sale.total)}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleViewSale(sale)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vista desktop: Tabla */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead># Venta</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Vendedor</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(sale.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                {sale.customer?.name || "Cliente General"}
                              </div>
                            </TableCell>
                            <TableCell>{sale.user?.name || "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-3 w-3 text-muted-foreground" />
                                {getPaymentMethodLabel(sale.paymentMethod)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(sale.status)}
                                {sale.isCredit && (
                                  <Badge variant="outline" className="text-xs">Fiado</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(sale.total)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewSale(sale)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {salesData?.pagination && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
                      <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                        Mostrando {((salesPage - 1) * 20) + 1} - {Math.min(salesPage * 20, salesData.pagination.total)} de {salesData.pagination.total} ventas
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                          disabled={salesPage === 1}
                          className="text-xs sm:text-sm"
                        >
                          <span className="sm:hidden">←</span>
                          <span className="hidden sm:inline">Anterior</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSalesPage(p => p + 1)}
                          disabled={salesPage >= salesData.pagination.totalPages}
                          className="text-xs sm:text-sm"
                        >
                          <span className="sm:hidden">→</span>
                          <span className="hidden sm:inline">Siguiente</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-[250px] sm:h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                  <Receipt className="h-12 w-12 mb-4 opacity-50" />
                  <p>No hay ventas registradas</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de detalle de venta */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Venta #{selectedSale?.saleNumber}</DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-6">
              {/* Info general */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {format(new Date(selectedSale.createdAt), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedSale.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedSale.customer?.name || "Cliente General"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pago</p>
                  <p className="font-medium">{getPaymentMethodLabel(selectedSale.paymentMethod)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendedor</p>
                  <p className="font-medium">{selectedSale.user?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{selectedSale.isCredit ? "Venta a Crédito" : "Venta Normal"}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-3">Productos</h4>
                {/* Vista móvil: Cards */}
                <div className="block md:hidden space-y-2">
                  {selectedSale.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-secondary/30 border border-border/50"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.productName}</p>
                          {item.productSku && (
                            <p className="text-xs text-muted-foreground">SKU: {item.productSku}</p>
                          )}
                          {item.isManual && (
                            <Badge variant="outline" className="text-xs mt-1">Manual</Badge>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-medium text-sm">{formatCurrency(item.totalPrice)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Cantidad: {item.quantity}</span>
                        <span>Precio Unit.: {formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Vista desktop: Tabla */}
                <div className="hidden md:block border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              {item.productSku && (
                                <p className="text-xs text-muted-foreground">SKU: {item.productSku}</p>
                              )}
                              {item.isManual && (
                                <Badge variant="outline" className="text-xs mt-1">Manual</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totales */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discountValue && selectedSale.discountValue > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Descuento ({selectedSale.discountType === "PERCENTAGE" ? `${selectedSale.discountValue}%` : "Fijo"})</span>
                    <span>-{formatCurrency(
                      selectedSale.discountType === "PERCENTAGE" 
                        ? (selectedSale.subtotal * selectedSale.discountValue / 100)
                        : selectedSale.discountValue
                    )}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA ({(selectedSale.taxRate * 100).toFixed(0)}%)</span>
                  <span>{formatCurrency(selectedSale.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>

              {/* Notas */}
              {selectedSale.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                    {selectedSale.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
