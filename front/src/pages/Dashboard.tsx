import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { DollarSign, ShoppingBag, Package, AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { capitalizeString } from "@/hooks/use-utils";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/services/analytics";

export default function Dashboard() {
  const { user } = useAuthStore((state) => state);

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => analyticsApi.getDashboardStats(),
    refetchInterval: 60000, // Refrescar cada minuto
  });

  const { data: chartData, isLoading: loadingChart } = useQuery({
    queryKey: ["weeklyChart"],
    queryFn: () => analyticsApi.getWeeklySalesChart(),
  });

  const { data: topProducts, isLoading: loadingTopProducts } = useQuery({
    queryKey: ["topProducts"],
    queryFn: () => analyticsApi.getTopProducts(5, "month"),
  });

  const { data: recentSales, isLoading: loadingRecentSales } = useQuery({
    queryKey: ["recentSales"],
    queryFn: () => analyticsApi.getRecentSales(5),
  });

  const { data: lowStockProducts, isLoading: loadingLowStock } = useQuery({
    queryKey: ["lowStockProducts"],
    queryFn: () => analyticsApi.getLowStockProducts(),
  });

  const isLoading = loadingStats || loadingChart || loadingTopProducts || loadingRecentSales || loadingLowStock;

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Hola {capitalizeString(user?.name || "")} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Aquí está el resumen de tu negocio hoy
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>

        {/* Stats Grid */}
        {loadingStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="dashboard-stats">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card flex items-center justify-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="dashboard-stats">
            <StatCard
              title="Ventas Hoy"
              value={stats?.todaySales || 0}
              icon={ShoppingBag}
              change={stats?.dailyChange || 0}
              changeLabel="vs ayer"
              variant="primary"
            />
            <StatCard
              title="Ingresos Hoy"
              value={`$${(stats?.todayRevenue || 0).toLocaleString()}`}
              icon={DollarSign}
              change={stats?.monthlyGrowth || 0}
              changeLabel="este mes"
              variant="success"
            />
            <StatCard
              title="Total Productos"
              value={stats?.totalProducts || 0}
              icon={Package}
              variant="default"
            />
            <StatCard
              title="Stock Bajo"
              value={stats?.lowStockProducts || 0}
              icon={AlertTriangle}
              variant="warning"
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2" data-tour="dashboard-chart">
            <SalesChart data={chartData || []} isLoading={loadingChart} />
          </div>
          <div data-tour="dashboard-lowstock">
            <LowStockAlert products={lowStockProducts || []} isLoading={loadingLowStock} />
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div data-tour="dashboard-recent">
            <RecentSales sales={recentSales || []} isLoading={loadingRecentSales} />
          </div>
          <div data-tour="dashboard-top">
            <TopProducts products={topProducts || []} isLoading={loadingTopProducts} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
