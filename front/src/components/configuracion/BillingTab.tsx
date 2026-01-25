import { Printer } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const BillingTab = () => {
    return (
        <div className="space-y-6">
            <div className="bunker-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    Configuración de Tickets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="ticket-header">Encabezado del Ticket</Label>
                        <Input id="ticket-header" defaultValue="¡Gracias por su compra!" />
                    </div>
                    <div>
                        <Label htmlFor="ticket-footer">Pie del Ticket</Label>
                        <Input id="ticket-footer" defaultValue="Vuelva pronto" />
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-3">
                            <Printer className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-medium text-foreground">Imprimir Automáticamente</p>
                                <p className="text-sm text-muted-foreground">
                                    Imprimir ticket al completar cada venta
                                </p>
                            </div>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </div>
            </div>
        </div>
    );
}
