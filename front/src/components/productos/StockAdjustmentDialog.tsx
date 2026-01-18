import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Loader2 } from "lucide-react";
import { Product } from "@/api/services/products";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  stockQuantity: number;
  setStockQuantity: (quantity: number) => void;
  stockOperation: "add" | "subtract" | "set";
  setStockOperation: (operation: "add" | "subtract" | "set") => void;
  onSave: () => void;
  isLoading: boolean;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  stockQuantity,
  setStockQuantity,
  stockOperation,
  setStockOperation,
  onSave,
  isLoading,
}: StockAdjustmentDialogProps) {
  const calculateNewStock = () => {
    if (!product) return 0;
    if (stockOperation === "add") return product.stock + stockQuantity;
    if (stockOperation === "subtract") return product.stock - stockQuantity;
    return stockQuantity;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {product && (
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                Stock actual: <span className="font-bold">{product.stock}</span>
              </p>
            </div>
          )}
          <div>
            <Label>Tipo de Operación</Label>
            <Select
              value={stockOperation}
              onValueChange={(value: "add" | "subtract" | "set") => setStockOperation(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center">
                    <ArrowDownCircle className="w-4 h-4 mr-2 text-success" />
                    Entrada (Sumar)
                  </div>
                </SelectItem>
                <SelectItem value="subtract">
                  <div className="flex items-center">
                    <ArrowUpCircle className="w-4 h-4 mr-2 text-destructive" />
                    Salida (Restar)
                  </div>
                </SelectItem>
                <SelectItem value="set">
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 text-warning" />
                    Ajuste (Establecer)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              min={0}
              value={stockQuantity}
              onChange={(e) => setStockQuantity(Number(e.target.value))}
            />
          </div>
          {stockOperation !== "set" && product && (
            <p className="text-sm text-muted-foreground">
              Nuevo stock:{" "}
              <span className="font-bold">{calculateNewStock()}</span>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
