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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { CurrentAccount } from "@/api/services/customers";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: CurrentAccount | null;
  paymentAmount: number;
  setPaymentAmount: (amount: number) => void;
  paymentMethod: "CASH" | "CARD" | "TRANSFER";
  setPaymentMethod: (method: "CASH" | "CARD" | "TRANSFER") => void;
  paymentNotes: string;
  setPaymentNotes: (notes: string) => void;
  onSave: () => void;
  isLoading: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  account,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  paymentNotes,
  setPaymentNotes,
  onSave,
  isLoading,
}: PaymentDialogProps) {
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return "Efectivo";
      case "CARD":
        return "Tarjeta";
      case "TRANSFER":
        return "Transferencia";
      default:
        return method;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {account && (
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-sm text-muted-foreground">Saldo pendiente</p>
              <p className="text-xl font-bold text-destructive">
                ${account.currentBalance.toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <Label>Monto a pagar</Label>
            <Input
              type="number"
              min={0}
              max={account?.currentBalance || 0}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="text-lg"
            />
            {account && (
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(account.currentBalance)}
                >
                  Total
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(Math.round(account.currentBalance / 2))}
                >
                  50%
                </Button>
              </div>
            )}
          </div>
          <div>
            <Label>Método de pago</Label>
            <Select 
              value={paymentMethod} 
              onValueChange={(value: "CASH" | "CARD" | "TRANSFER") => setPaymentMethod(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">{getPaymentMethodLabel("CASH")}</SelectItem>
                <SelectItem value="CARD">{getPaymentMethodLabel("CARD")}</SelectItem>
                <SelectItem value="TRANSFER">{getPaymentMethodLabel("TRANSFER")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notas (opcional)</Label>
            <Textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Referencia de transferencia, notas del pago..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={isLoading || paymentAmount <= 0}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Registrar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
