import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { mockDashboardStats } from "@/data/mockData";
import { DollarSign, ShoppingBag, Package, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

export default function Dashboard() {
  const stats = mockDashboardStats;

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Bienvenido a <span className="text-gradient">BUNKER</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Ventas Hoy"
            value={stats.todaySales}
            icon={ShoppingBag}
            change={12}
            changeLabel="vs ayer"
            variant="primary"
          />
          <StatCard
            title="Ingresos Hoy"
            value={`$${stats.todayRevenue.toLocaleString()}`}
            icon={DollarSign}
            change={stats.monthlyGrowth}
            changeLabel="este mes"
            variant="success"
          />
          <StatCard
            title="Total Productos"
            value={stats.totalProducts}
            icon={Package}
            variant="default"
          />
          <StatCard
            title="Stock Bajo"
            value={stats.lowStockProducts}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart />
          </div>
          <div>
            <LowStockAlert />
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentSales />
          <TopProducts />
        </div>
      </div>
    </MainLayout>
  );
}
