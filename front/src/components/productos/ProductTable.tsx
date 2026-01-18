import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface ProductTableProps {
  products: Product[];
  onAdjustStock: (product: Product) => void;
  onEdit: (product: Product) => void;
  onToggleState: (product: Product) => void;
  onDelete: (product: Product) => void;
  getStateBadge: (state: string, stock: number, minStock: number) => React.ReactNode;
}

export function ProductTable({
  products,
  onAdjustStock,
  onEdit,
  onToggleState,
  onDelete,
  getStateBadge,
}: ProductTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground text-xs sm:text-sm pl-3 sm:pl-4">Producto</TableHead>
            <TableHead className="text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">SKU</TableHead>
            <TableHead className="text-muted-foreground text-xs sm:text-sm text-right">Precio</TableHead>
            <TableHead className="text-muted-foreground text-xs sm:text-sm text-center">Stock</TableHead>
            <TableHead className="text-muted-foreground text-xs sm:text-sm text-center hidden md:table-cell">Mín</TableHead>
            <TableHead className="text-muted-foreground text-xs sm:text-sm text-center hidden lg:table-cell">Res.</TableHead>
            <TableHead className="text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">Estado</TableHead>
            <TableHead className="text-muted-foreground text-xs sm:text-sm text-center pr-3 sm:pr-4"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="border-border">
              <TableCell className="pl-3 sm:pl-4 py-2 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-foreground text-xs sm:text-sm line-clamp-1 sm:line-clamp-2">
                      {product.name}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">
                {product.sku || "-"}
              </TableCell>
              <TableCell className="text-right font-semibold text-xs sm:text-sm text-foreground whitespace-nowrap">
                {product.sale_price ? `$${product.sale_price.toLocaleString()}` : "-"}
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-bold text-xs sm:text-sm ${
                  product.stock <= 0 
                    ? "text-destructive" 
                    : product.stock <= (product.min_stock || 5) 
                    ? "text-warning" 
                    : "text-foreground"
                }`}>
                  {product.stock}
                </span>
              </TableCell>
              <TableCell className="text-center text-xs sm:text-sm text-muted-foreground hidden md:table-cell">
                {product.min_stock ?? 5}
              </TableCell>
              <TableCell className="text-center text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">
                {product.reserved_stock || 0}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {getStateBadge(product.state, product.stock, product.min_stock || 5)}
              </TableCell>
              <TableCell className="text-center pr-3 sm:pr-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                      <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
