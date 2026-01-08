import { MainLayout } from "@/components/layout/MainLayout";
import { salesChartData, categoryData, topProducts, mockDashboardStats } from "@/data/mockData";
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
import { 
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function Reportes() {
  const stats = mockDashboardStats;

  return (
    <MainLayout title="Reportes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reportes y Análisis</h1>
            <p className="text-muted-foreground">
              Visualiza el rendimiento de tu negocio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Enero 2024
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas Totales</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalSales}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                  <span className="text-xs text-success">+12% vs mes anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-primary/20">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-2xl font-bold text-foreground">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                  <span className="text-xs text-success">+{stats.monthlyGrowth}%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-success/20">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                <p className="text-2xl font-bold text-foreground">$294.17</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowDownRight className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-destructive">-3% vs mes anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-warning/20">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Nuevos</p>
                <p className="text-2xl font-bold text-foreground">28</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                  <span className="text-xs text-success">+8% vs mes anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-secondary">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ventas" className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="ventas">Ventas</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="categorias">Categorías</TabsTrigger>
          </TabsList>

          <TabsContent value="ventas">
            <div className="bunker-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Tendencia de Ventas</h3>
                  <p className="text-sm text-muted-foreground">Últimos 7 días</p>
                </div>
                <Badge variant="outline" className="border-success text-success">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Creciendo
                </Badge>
              </div>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(220, 18%, 15%)', 
                        border: '1px solid hsl(220, 15%, 22%)',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
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
            </div>
          </TabsContent>

          <TabsContent value="productos">
            <div className="bunker-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Productos Más Vendidos</h3>
                  <p className="text-sm text-muted-foreground">Top 5 por ingresos</p>
                </div>
              </div>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={topProducts} 
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 22%)" horizontal={false} />
                    <XAxis 
                      type="number"
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }}
                      tickFormatter={(value) => `$${value / 1000}k`}
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
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ingresos']}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="hsl(45, 100%, 51%)" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categorias">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bunker-card p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Ventas por Categoría</h3>
                  <p className="text-sm text-muted-foreground">Distribución porcentual</p>
                </div>
                
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(220, 18%, 15%)', 
                          border: '1px solid hsl(220, 15%, 22%)',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value}%`, 'Participación']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bunker-card p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Detalle por Categoría</h3>
                  <p className="text-sm text-muted-foreground">Rendimiento mensual</p>
                </div>
                
                <div className="space-y-4">
                  {categoryData.map((category) => (
                    <div key={category.name} className="flex items-center gap-4">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.fill }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground">{category.name}</span>
                          <span className="text-sm text-muted-foreground">{category.value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${category.value}%`,
                              backgroundColor: category.fill
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
