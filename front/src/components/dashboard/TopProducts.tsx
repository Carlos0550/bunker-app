import { topProducts } from "@/data/mockData";
import { TrendingUp } from "lucide-react";

export function TopProducts() {
  const maxRevenue = Math.max(...topProducts.map(p => p.revenue));

  return (
    <div className="bunker-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Productos Top</h3>
          <p className="text-sm text-muted-foreground">Por ingresos este mes</p>
        </div>
        <TrendingUp className="w-5 h-5 text-success" />
      </div>
      
      <div className="space-y-4">
        {topProducts.map((product, index) => (
          <div key={product.name} className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(product.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                ${product.revenue.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{product.sales} ventas</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
