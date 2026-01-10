import { Clock, CreditCard, Banknote, Building2, Loader2, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecentSale {
  id: string;
  saleNumber: string;
  customerName: string;
  total: number;
  itemCount: number;
  paymentMethod: string;
  createdAt: string;
  processedBy?: string;
}

interface RecentSalesProps {
  sales: RecentSale[];
  isLoading?: boolean;
}

const paymentMethodIcons: Record<string, any> = {
  CASH: Banknote,
  CARD: CreditCard,
  TRANSFER: Building2,
  OTHER: CreditCard,
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

export function RecentSales({ sales, isLoading }: RecentSalesProps) {
  if (isLoading) {
    return (
      <div className="bunker-card p-6 animate-fade-in h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bunker-card p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Ventas Recientes</h3>
      </div>
      
      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
          <p>No hay ventas recientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => {
            const Icon = paymentMethodIcons[sale.paymentMethod] || CreditCard;
            return (
              <div
                key={sale.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{sale.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.saleNumber} • {sale.itemCount} productos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">${sale.total.toLocaleString()}</p>
                  <Badge variant="outline" className="text-xs">
                    {paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
