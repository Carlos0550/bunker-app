import React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, RotateCcw } from "lucide-react";
import { Product } from "@/api/services/products";
import { EmptyState } from "@/components/shared";

interface DeletedProductsTabProps {
  products: Product[];
  onRestore: (id: string) => void;
  isLoading?: boolean;
}

export function DeletedProductsTab({
  products,
  onRestore,
  isLoading,
}: DeletedProductsTabProps) {
  if (products.length === 0) {
    return (
      <div className="bunker-card p-12">
        <EmptyState
          icon={Trash2}
          title="Papelera vacía"
          description="No hay productos eliminados"
        />
      </div>
    );
  }

  return (
    <div className="bunker-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Producto</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">SKU</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Eliminado</TableHead>
              <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="border-border">
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    {/* Info adicional en móvil */}
                    <div className="sm:hidden text-xs text-muted-foreground mt-1">
                      {product.sku && <span className="font-mono">{product.sku} • </span>}
                      {product.deletedAt && new Date(product.deletedAt).toLocaleDateString("es-ES")}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground hidden sm:table-cell">
                  {product.sku || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">
                  {product.deletedAt
                    ? new Date(product.deletedAt).toLocaleDateString("es-ES")
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore(product.id)}
                    disabled={isLoading}
                  >
                    <RotateCcw className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Restaurar</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
