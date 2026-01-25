import { Package, AlertTriangle, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingContainer } from "@/components/shared";
import { Product } from "@/api/services/products";

interface LowStockTabProps {
    lowStockProducts: Product[];
    loading: boolean;
    onAdjustStock: (p: Product) => void;
}

export const LowStockTab = ({ lowStockProducts, loading, onAdjustStock }: LowStockTabProps) => {
    return (
        <div className="space-y-4">
            {loading ? (
                <div className="p-12"><LoadingContainer /></div>
            ) : lowStockProducts.length === 0 ? (
                <div className="bunker-card">
                    <EmptyState
                        icon={Package}
                        title="Sin productos con stock bajo"
                        description="Todos los productos tienen stock suficiente"
                    />
                </div>
            ) : (
                <div className="space-y-2">
                    {lowStockProducts.map((product) => (
                        <div key={product.id} className="bunker-card p-4 border-l-4 border-warning">
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground truncate">{product.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Stock: <span className="font-bold text-warning">{product.stock}</span>
                                        {" / Mínimo: "}{product.min_stock}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onAdjustStock(product)}
                                >
                                    <ArrowDownCircle className="w-4 h-4 mr-1" />
                                    Reponer Stock
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
