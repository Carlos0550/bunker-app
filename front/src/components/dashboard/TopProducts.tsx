import { TrendingUp, Package, Loader2 } from "lucide-react";

interface TopProduct {
  productId: string;
  productName: string;
  salesCount: number;
  quantitySold: number;
  revenue: number;
}

interface TopProductsProps {
  products: TopProduct[];
  isLoading?: boolean;
}

export function TopProducts({ products, isLoading }: TopProductsProps) {
  if (isLoading) {
    return (
      <div className="bunker-card p-6 animate-fade-in h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bunker-card p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Productos Top</h3>
      </div>
      
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mb-2 opacity-50" />
          <p>No hay datos de ventas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => (
            <div
              key={product.productId || index}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{product.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.quantitySold} unidades vendidas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">${product.revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{product.salesCount} ventas</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
