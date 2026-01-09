import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusinessStore } from "@/store/useBusinessStore";
import { 
  Building2, 
  Bell, 
  Shield, 
  Database,
  Printer,
  Mail,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Configuracion() {
  const { businessData, fetchBusinessData } = useBusinessStore();

  useEffect(() => {
    fetchBusinessData();
  }, [fetchBusinessData]);

  const handleSave = () => {
    toast.success("Configuración guardada");
  };

  return (
    <MainLayout title="Configuración">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">
            Administra las preferencias del sistema
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="empresa" className="space-y-6">
          <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="empresa" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Empresa</span>
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificaciones</span>
            </TabsTrigger>
            <TabsTrigger value="facturacion" className="gap-2">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Facturación</span>
            </TabsTrigger>
            <TabsTrigger value="seguridad" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Seguridad</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="space-y-6">
            <div className="bunker-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Información de la Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Nombre de la Empresa</Label>
                  <Input id="company-name" value={businessData?.name || ""} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Dirección Física</Label>
                  <Input id="address" value={businessData?.address || ""} />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" value={businessData?.contact_phone || ""} />
                </div>
                <div>
                  <Label htmlFor="email">Email de Contacto</Label>
                  <Input id="email" type="email" value={businessData?.contact_email || ""} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notificaciones" className="space-y-6">
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
                    <Database className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Respaldo Automático</p>
                      <p className="text-sm text-muted-foreground">
                        Notificar cuando se complete un respaldo de datos
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="facturacion" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="seguridad" className="space-y-6">
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
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bunker-glow">
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
