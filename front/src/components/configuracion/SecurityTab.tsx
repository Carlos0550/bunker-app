import { Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SecurityTab = () => {
    return (
        <div className="space-y-6">
            <div className="bunker-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    Seguridad de la Cuenta
                </h3>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="current-password">Contraseña Actual</Label>
                        <Input id="current-password" type="password" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="new-password">Nueva Contraseña</Label>
                            <Input id="new-password" type="password" />
                        </div>
                        <div>
                            <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                            <Input id="confirm-password" type="password" />
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-medium text-foreground">Autenticación de Dos Factores</p>
                                <p className="text-sm text-muted-foreground">
                                    Agregar una capa extra de seguridad
                                </p>
                            </div>
                        </div>
                        <Switch />
                    </div>
                </div>
            </div>
        </div>
    );
};
