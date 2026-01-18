import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Package, 
  MoreVertical, 
  RefreshCw, 
  Edit2, 
  CheckCircle, 
  Ban, 
  Trash2 
} from "lucide-react";
import { Product } from "@/api/services/products";

interface ProductCardProps {
  product: Product;
  onAdjustStock: (product: Product) => void;
  onEdit: (product: Product) => void;
  onToggleState: (product: Product) => void;
  onDelete: (product: Product) => void;
  getStateBadge: (state: string, stock: number, minStock: number) => React.ReactNode;
}

export function ProductCard({
  product,
  onAdjustStock,
  onEdit,
  onToggleState,
  onDelete,
  getStateBadge,
}: ProductCardProps) {
  return (
    <div className="bunker-card p-3 border border-border/50 hover:border-border transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
              {product.name}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAdjustStock(product)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Ajustar Stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(product)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {product.state === "DISABLED" ? (
                  <DropdownMenuItem onClick={() => onToggleState(product)}>
                    <CheckCircle className="w-4 h-4 mr-2 text-success" />
                    Activar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onToggleState(product)}>
                    <Ban className="w-4 h-4 mr-2 text-warning" />
                    Deshabilitar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(product)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <div className="text-xs text-muted-foreground mb-0.5">Precio</div>
              <div className="font-semibold text-sm text-foreground">
                {product.sale_price ? `$${product.sale_price.toLocaleString()}` : "-"}
              </div>
            </div>
            <div className="flex-1 min-w-[80px]">
              <div className="text-xs text-muted-foreground mb-0.5">Stock</div>
              <div className={`font-bold text-sm ${product.stock <= 0 ? "text-destructive" : product.stock <= (product.min_stock || 5) ? "text-warning" : "text-foreground"}`}>
                {product.stock}
              </div>
            </div>
            <div className="flex-1 min-w-[80px]">
              <div className="text-xs text-muted-foreground mb-0.5">Mín</div>
              <div className="text-sm text-muted-foreground">
                {product.min_stock ?? 5}
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-border/50">
            {getStateBadge(product.state, product.stock, product.min_stock || 5)}
            {product.sku && (
              <span className="ml-2 text-xs text-muted-foreground font-mono">
                SKU: {product.sku}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
