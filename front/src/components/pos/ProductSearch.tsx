import { Product } from "@/api/services/products";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ScanLine, ShoppingCart, Loader2, Package } from "lucide-react";

interface ProductSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onScanClick: () => void;
  products: Product[];
  isLoading: boolean;
  onProductClick: (product: Product) => void;
}

export function ProductSearch({
  searchTerm,
  onSearchChange,
  onScanClick,
  products,
  isLoading,
  onProductClick,
}: ProductSearchProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {}
      <div className="flex gap-2">
        <div className="relative flex-1" data-tour="pos-search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, SKU o código de barras..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 bg-card border-border text-lg"
          />
        </div>
        <Button
          variant="default"
          className="h-12 px-4"
          onClick={onScanClick}
          title="Escanear código de barras"
          data-tour="pos-scan"
        >
          <ScanLine className="w-5 h-5 mr-2" />
          Escanear
        </Button>
      </div>

      {}
      <div className="flex-1 overflow-auto scrollbar-thin" data-tour="pos-products">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Package className="w-16 h-16 mb-4 opacity-50" />
            <p>No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductClick(product)}
                className="bunker-card p-4 text-left transition-all hover:border-primary/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="aspect-square rounded-lg bg-secondary/50 mb-3 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
                <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {product.sku || "Sin SKU"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ${(product.sale_price || 0).toLocaleString()}
                  </span>
                  <Badge
                    variant={
                      product.stock <= (product.min_stock || 5)
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px]"
                  >
                    Stock: {product.stock}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
