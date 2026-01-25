import { Button } from "@/components/ui/button";
import { CreditCard, Banknote, Building2 } from "lucide-react";

type PaymentMethod = "CASH" | "CARD" | "TRANSFER";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  installments?: number;
  onInstallmentsChange?: (value: number) => void;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  installments = 1,
  onInstallmentsChange,
}: PaymentMethodSelectorProps) {
  const methods = [
    { value: "CASH" as const, icon: Banknote, label: "Efectivo" },
    { value: "CARD" as const, icon: CreditCard, label: "Tarjeta" },
    { value: "TRANSFER" as const, icon: Building2, label: "Transfer" },
  ];

  return (
    <div className="space-y-3" data-tour="pos-payment">
      <div className="grid grid-cols-3 gap-2">
        {methods.map(({ value, icon: Icon, label }) => (
          <Button
            key={value}
            variant={selected === value ? "default" : "secondary"}
            className="flex-col h-auto py-3 gap-1"
            onClick={() => {
              onSelect(value);
              if (value !== "CARD" && onInstallmentsChange) {
                onInstallmentsChange(1);
              }
            }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>

      {}
      {selected === "CARD" && onInstallmentsChange && (
        <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-lg border border-border/50">
          <CreditCard className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium whitespace-nowrap">
            Cuotas:
          </span>
          <div className="flex gap-1 flex-1 overflow-x-auto scrollbar-hide">
            {[1, 2, 3, 6, 12].map((n) => (
              <Button
                key={n}
                size="sm"
                variant={installments === n ? "default" : "outline"}
                className="h-7 px-3 text-xs"
                onClick={() => onInstallmentsChange(n)}
              >
                {n === 1 ? "1 (Contado)" : n}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
