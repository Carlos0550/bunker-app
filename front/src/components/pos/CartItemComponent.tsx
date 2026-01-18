import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2 } from "lucide-react";

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  isManual: boolean;
  maxStock?: number;
}

interface CartItemComponentProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItemComponent({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemComponentProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg ${
        item.isManual ? "bg-warning/10 border border-warning/20" : "bg-secondary/30"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium text-foreground truncate">
            {item.name}
          </p>
          {item.isManual && (
            <Badge variant="outline" className="text-[10px] border-warning text-warning">
              Manual
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          ${item.price.toLocaleString()} c/u
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onUpdateQuantity(item.id, -1)}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-8 text-center font-medium">
          {item.quantity}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onUpdateQuantity(item.id, 1)}
          title="Aumentar cantidad"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      <p className="text-sm font-bold text-foreground w-20 text-right">
        ${(item.price * item.quantity).toLocaleString()}
      </p>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
