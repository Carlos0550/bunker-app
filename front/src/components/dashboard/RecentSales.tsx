import { mockSales } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, Building2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  transfer: Building2,
};

const paymentLabels = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

export function RecentSales() {
  return (
    <div className="bunker-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ventas Recientes</h3>
          <p className="text-sm text-muted-foreground">Últimas transacciones</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Hoy
        </Badge>
      </div>
      
      <div className="space-y-4">
        {mockSales.slice(0, 5).map((sale) => {
          const PaymentIcon = paymentIcons[sale.paymentMethod];
          return (
            <div key={sale.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <PaymentIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {sale.customerName}
                  </p>
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    {sale.id}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(sale.createdAt, "dd MMM, HH:mm", { locale: es })} • {paymentLabels[sale.paymentMethod]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  ${sale.total.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sale.items.length} items
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
