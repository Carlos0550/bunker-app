import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

interface ChartDataPoint {
  name: string;
  date: string;
  ventas: number;
}

interface SalesChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

export function SalesChart({ data, isLoading }: SalesChartProps) {
  if (isLoading) {
    return (
      <div className="bunker-card p-6 animate-fade-in h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bunker-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ventas de la Semana</h3>
          <p className="text-sm text-muted-foreground">Ingresos de los últimos 7 días</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Ventas</span>
          </div>
        </div>
      </div>
      
      <div className="h-[300px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No hay datos de ventas para mostrar
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={(value) => value >= 1000 ? `$${value / 1000}k` : `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(220, 18%, 15%)', 
                  border: '1px solid hsl(220, 15%, 22%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 24px hsl(0 0% 0% / 0.4)'
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
                fill="url(#colorVentas)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
