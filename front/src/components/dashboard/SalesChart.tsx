import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { salesChartData } from "@/data/mockData";

export function SalesChart() {
  return (
    <div className="bunker-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ventas de la Semana</h3>
          <p className="text-sm text-muted-foreground">Comparación ventas vs gastos</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Ventas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">Gastos</span>
          </div>
        </div>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(45, 100%, 51%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(45, 100%, 51%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 15%, 40%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(220, 15%, 40%)" stopOpacity={0}/>
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
                borderRadius: '8px',
                boxShadow: '0 4px 24px hsl(0 0% 0% / 0.4)'
              }}
              labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
            />
            <Area 
              type="monotone" 
              dataKey="ventas" 
              stroke="hsl(45, 100%, 51%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorVentas)" 
            />
            <Area 
              type="monotone" 
              dataKey="gastos" 
              stroke="hsl(220, 15%, 40%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorGastos)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
