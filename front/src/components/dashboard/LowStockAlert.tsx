import { AlertTriangle, Package, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  threshold: number;
  deficit: number;
}

interface LowStockAlertProps {
  products: LowStockProduct[];
  isLoading?: boolean;
}

export function LowStockAlert({ products, isLoading }: LowStockAlertProps) {
  if (isLoading) {
    return (
      <div className="bunker-card p-6 animate-fade-in h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bunker-card p-6 animate-fade-in border-warning/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="text-lg font-semibold text-foreground">Stock Bajo</h3>
        </div>
        {products.length > 0 && (
          <Badge variant="destructive">{products.length}</Badge>
        )}
      </div>
      
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mb-2 opacity-50 text-success" />
          <p className="text-success">¡Todo en orden!</p>
          <p className="text-sm">No hay productos con stock bajo</p>
        </div>
      ) : (
        <ScrollArea className="h-[250px] pr-2">
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                    <Package className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm truncate max-w-[150px]">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mínimo: {product.threshold}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-warning">{product.stock}</p>
                  <p className="text-xs text-destructive">-{product.deficit}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
