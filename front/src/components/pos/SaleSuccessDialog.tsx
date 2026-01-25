import { Sale } from "@/api/services/sales";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Printer, X } from "lucide-react";
import { printReceipt } from "@/utils/printReceipt";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SaleSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
}

import { formatCurrency } from "@/utils/helpers";

export function SaleSuccessDialog({
  open,
  onClose,
  sale,
  businessName,
  businessAddress,
  businessPhone,
}: SaleSuccessDialogProps) {
  if (!sale) return null;

  const handlePrint = () => {
    printReceipt({
      sale,
      businessName,
      businessAddress,
      businessPhone,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            ¡Venta Completada!
          </DialogTitle>
          <DialogDescription className="text-center">
            La venta se ha procesado exitosamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ticket</span>
              <span className="font-mono font-bold">#{sale.saleNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Fecha</span>
              <span className="text-sm">
                {format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Items</span>
              <span className="text-sm">{sale.items.length} producto(s)</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(sale.total)}
              </span>
            </div>
            <div className="flex justify-center">
              <Badge variant={sale.isCredit ? "outline" : "default"}>
                {sale.isCredit ? "Fiado" : sale.paymentMethod === "CASH" ? "Efectivo" : 
                 sale.paymentMethod === "CARD" ? "Tarjeta" : "Transferencia"}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
