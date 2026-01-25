import { AlertTriangle, CheckCircle, Clock, Receipt } from "lucide-react";
import { formatCurrency } from "@/utils/helpers";

interface CustomerMetricsCardsProps {
  totalDebt: number;
  totalPaid: number;
  averagePaymentDays: number | null;
  totalAccountsCount: number;
}

export function CustomerMetricsCards({
  totalDebt,
  totalPaid,
  averagePaymentDays,
  totalAccountsCount,
}: CustomerMetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-tour="clientes-metrics">
      <div className="p-3 rounded-lg bg-destructive/10 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-xs text-muted-foreground truncate">Deuda Actual</span>
        </div>
        <p className="text-lg sm:text-xl font-bold text-destructive truncate">
          {formatCurrency(totalDebt)}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-success/10 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4 text-success shrink-0" />
          <span className="text-xs text-muted-foreground truncate">Total Pagado</span>
        </div>
        <p className="text-lg sm:text-xl font-bold text-success truncate">
          {formatCurrency(totalPaid)}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-primary/10 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground truncate">Prom. Pago</span>
        </div>
        <p className="text-lg sm:text-xl font-bold text-primary truncate">
          {averagePaymentDays !== null
            ? `${averagePaymentDays} días`
            : "N/A"}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-secondary min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Receipt className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">Cuentas</span>
        </div>
        <p className="text-lg sm:text-xl font-bold truncate">
          {totalAccountsCount}
        </p>
      </div>
    </div>
  );
}
