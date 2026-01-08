import { mockProducts } from "@/data/mockData";
import { AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function LowStockAlert() {
  const lowStockProducts = mockProducts.filter(p => p.stock <= p.minStock);

  return (
    <div className="bunker-card p-6 border-warning/30 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/20">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Stock Bajo</h3>
            <p className="text-sm text-muted-foreground">Productos que requieren atención</p>
          </div>
        </div>
        <Badge variant="destructive" className="text-xs">
          {lowStockProducts.length} productos
        </Badge>
      </div>
      
      <div className="space-y-3">
        {lowStockProducts.map((product) => (
          <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-warning">{product.stock}</p>
              <p className="text-[10px] text-muted-foreground">Min: {product.minStock}</p>
            </div>
          </div>
        ))}
      </div>
      
      <Button className="w-full mt-4" variant="outline">
        Ver todos los productos
      </Button>
    </div>
  );
}
