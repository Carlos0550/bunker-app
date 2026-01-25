import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { Plan } from "@/api/services/subscription";
import { formatCurrency } from "@/utils/helpers";

interface PlanChangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedPlan: Plan | null;
    onConfirm: () => void;
    isPending: boolean;
}

export const PlanChangeDialog = ({
    open,
    onOpenChange,
    selectedPlan,
    onConfirm,
    isPending,
}: PlanChangeDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Cambio de Plan</DialogTitle>
                    <DialogDescription>
                        Estás a punto de cambiar tu plan actual.
                    </DialogDescription>
                </DialogHeader>

                {selectedPlan && (
                    <div className="py-4">
                        <div className="p-4 bg-secondary/30 rounded-lg mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-muted-foreground">Nuevo plan:</span>
                                <span className="font-bold text-foreground">{selectedPlan.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Precio mensual:</span>
                                <span className="font-bold text-primary">{formatCurrency(selectedPlan.price)}</span>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Al confirmar, tu plan se actualizará inmediatamente y se registrará un pago
                            por el nuevo monto. Tu próxima fecha de pago será en 30 días.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="bunker-glow"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Confirmar Cambio
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
