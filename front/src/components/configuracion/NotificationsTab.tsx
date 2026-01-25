import { Bell, CreditCard, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const NotificationsTab = () => {
  return (
    <div className="space-y-6">
      <div className="bunker-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Preferencias de Notificaciones
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Stock Bajo</p>
                <p className="text-sm text-muted-foreground">
                  Recibir alertas cuando un producto alcance el stock mínimo
                </p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Resumen Diario</p>
                <p className="text-sm text-muted-foreground">
                  Recibir un resumen de ventas por email cada día
                </p>
              </div>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Recordatorio de Pago</p>
                <p className="text-sm text-muted-foreground">
                  Recibir notificaciones antes del vencimiento de tu suscripción
                </p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>
    </div>
  );
};
