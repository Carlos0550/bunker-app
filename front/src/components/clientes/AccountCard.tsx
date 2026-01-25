import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Banknote, 
  Edit3,
  CheckCircle,
  X,
  Loader2,
  Receipt
} from "lucide-react";
import { CurrentAccount } from "@/api/services/customers";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/utils/helpers";

interface AccountCardProps {
  account: CurrentAccount;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onRegisterPayment: () => void;
  onViewItems: (saleId: string) => void;
  editingNotes: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
  onCancelNotes: () => void;
  onStartEditNotes: () => void;
  isSavingNotes: boolean;
  getDaysInfo: (account: CurrentAccount) => { text: string; color: string };
}

export function AccountCard({
  account,
  isExpanded,
  onToggleExpanded,
  onRegisterPayment,
  onViewItems,
  editingNotes,
  notes,
  onNotesChange,
  onSaveNotes,
  onCancelNotes,
  onStartEditNotes,
  isSavingNotes,
  getDaysInfo,
}: AccountCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="destructive">Pendiente</Badge>;
      case "PARTIAL":
        return <Badge variant="outline" className="border-warning text-warning">Parcial</Badge>;
      case "PAID":
        return <Badge variant="outline" className="border-success text-success">Pagado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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

  const daysInfo = getDaysInfo(account);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <div className="rounded-lg border border-border overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left hover:bg-secondary/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(account.status)}
                    <span className="font-semibold">
                      {formatCurrency(account.currentBalance)}
                    </span>
                  </div>
                  <p className={`text-xs ${daysInfo.color}`}>
                    {daysInfo.text}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {format(new Date(account.createdAt), "dd MMM yyyy", { locale: es })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Original: {formatCurrency(account.originalAmount)}
                </p>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t border-border p-4 space-y-4 bg-secondary/10">
            {}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Monto Original</p>
                <p className="font-semibold">{formatCurrency(account.originalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Actual</p>
                <p className="font-semibold text-destructive">
                  {formatCurrency(account.currentBalance)}
                </p>
              </div>
            </div>

            {}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Notas</p>
                {!editingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={onStartEditNotes}
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="Agregar notas..."
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCancelNotes}
                      disabled={isSavingNotes}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={onSaveNotes}
                      disabled={isSavingNotes}
                    >
                      {isSavingNotes ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {account.notes || "Sin notas"}
                </p>
              )}
            </div>

            {}
            {account.payments && account.payments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  Historial de Pagos
                </p>
                <div className="space-y-1">
                  {account.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-2 rounded bg-success/5 border border-success/10"
                    >
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-success" />
                        <div>
                          <p className="text-sm font-medium text-success">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getPaymentMethodLabel(payment.paymentMethod)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            <div className="flex gap-2 pt-2">
              {account.status !== "PAID" && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={onRegisterPayment}
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Registrar Pago
                </Button>
              )}
              {account.sale && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onViewItems(account.saleId)}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Ver Items
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
