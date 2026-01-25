import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreditCard, Building2, Save } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import { useAuthStore } from "@/store/useAuthStore";
import { SubscriptionTab } from "@/components/configuracion/SubscriptionTab";
import { BusinessTab } from "@/components/configuracion/BusinessTab";
import { NotificationsTab } from "@/components/configuracion/NotificationsTab";
import { BillingTab } from "@/components/configuracion/BillingTab";
import { SecurityTab } from "@/components/configuracion/SecurityTab";

export default function Configuracion() {
  const { fetchBusinessData } = useBusinessStore();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (currentUser?.businessId) {
      fetchBusinessData(currentUser.businessId);
    }
  }, [fetchBusinessData, currentUser?.businessId]);

  const handleSave = () => {
    toast.success("Configuración guardada");
  };

  return (
    <MainLayout title="Configuración">
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        {}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra las preferencias del sistema y tu suscripción
          </p>
        </div>

        {}
        <Tabs defaultValue="suscripcion" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide" data-tour="config-tabs">
            <TabsList className="bg-secondary/50 inline-flex w-max sm:w-auto min-w-full sm:min-w-0 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="suscripcion" className="gap-1 sm:gap-2 text-sm sm:text-base px-2 sm:px-3 shrink-0">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Suscripción</span>
                <span className="sm:hidden">Susc.</span>
              </TabsTrigger>
              <TabsTrigger value="negocio" className="gap-1 sm:gap-2 text-sm sm:text-base px-2 sm:px-3 shrink-0">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Negocio</span>
                <span className="sm:hidden">Neg.</span>
              </TabsTrigger>
            {


}
            {


}
            </TabsList>
          </div>

          <TabsContent value="suscripcion">
            <SubscriptionTab />
          </TabsContent>

          <TabsContent value="negocio">
            <BusinessTab />
          </TabsContent>

          <TabsContent value="notificaciones">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="facturacion">
            <BillingTab />
          </TabsContent>

          <TabsContent value="seguridad">
            <SecurityTab />
          </TabsContent>
        </Tabs>

        {}
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
