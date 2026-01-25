import {
  Save,
  Phone,
  Mail,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultipliersConfig } from "@/components/MultipliersConfig";
import { useBusinessConfig } from "@/hooks/configuracion/useBusinessConfig";
import { User as UserType } from "@/api/services/users";

export const BusinessTab = () => {
  const {
    businessDetails,
    loadingBusiness,
    admins,
    contactPhone,
    setContactPhone,
    contactEmail,
    setContactEmail,
    businessName,
    setBusinessName,
    businessAddress,
    setBusinessAddress,
    selectedResponsibleId,
    setSelectedResponsibleId,
    updateContactMutation,
    updateBusinessDataMutation,
    setPaymentResponsibleMutation,
    handleSaveContact,
    handleSaveBusinessData,
    handleSavePaymentResponsible,
  } = useBusinessConfig();

  return (
    <div className="space-y-4 sm:space-y-6">
      {}
      <div className="bunker-card p-4 sm:p-6 w-full max-w-full overflow-hidden" data-tour="config-business">
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Información del Negocio</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Datos generales de tu negocio
          </p>
        </div>

        {loadingBusiness ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="company-name">Nombre del Negocio</Label>
                <Input
                  id="company-name"
                  onChange={(e) => setBusinessName(e.target.value)}
                  value={businessName || ""}
                  className="bg-secondary/30"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Dirección Física</Label>
                <Input
                  id="address"
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  value={businessAddress || ""}
                  className="bg-secondary/30"
                />
              </div>
            </div>
            <Button onClick={handleSaveBusinessData} disabled={updateBusinessDataMutation.isPending}>
              {updateBusinessDataMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardar Cambios
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {}
      <div className="bunker-card p-4 sm:p-6 w-full max-w-full overflow-hidden" data-tour="config-contact">
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Datos de Contacto</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Información de contacto para pagos y comunicaciones
          </p>
        </div>

        {loadingBusiness ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Teléfono (opcional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="contact-phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+52 555 123 4567"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Si no se proporciona, se usará el teléfono del responsable de pagos
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Email de Contacto (opcional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contacto@negocio.com"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Si no se proporciona, se usará el email del responsable de pagos
              </p>
            </div>

            <Button
              onClick={handleSaveContact}
              disabled={updateContactMutation.isPending}
            >
              {updateContactMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        )}
      </div>

      {}
      <div className="bunker-card p-4 sm:p-6 w-full max-w-full overflow-hidden" data-tour="config-responsible">
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Responsable de Pagos</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Administrador encargado de recibir notificaciones de pagos
          </p>
        </div>

        {loadingBusiness ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                El responsable de pagos recibirá todas las notificaciones relacionadas con:
                pagos de MercadoPago, recordatorios de vencimiento, y alertas de suscripción.
              </AlertDescription>
            </Alert>

            {businessDetails?.paymentResponsibleUser && (
              <div className="p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base text-foreground truncate">
                        {businessDetails.paymentResponsibleUser.name}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {businessDetails.paymentResponsibleUser.email}
                      </p>
                    </div>
                  </div>
                  <Badge className="shrink-0 w-full sm:w-auto text-center sm:text-left">Responsable Actual</Badge>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="payment-responsible">Seleccionar Responsable</Label>
              <Select
                value={selectedResponsibleId}
                onValueChange={setSelectedResponsibleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar administrador" />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((admin: UserType) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name} ({admin.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSavePaymentResponsible}
              disabled={
                !selectedResponsibleId ||
                selectedResponsibleId === businessDetails?.paymentResponsibleUserId ||
                setPaymentResponsibleMutation.isPending
              }
            >
              {setPaymentResponsibleMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Save className="w-4 h-4 mr-2" />
              Cambiar Responsable
            </Button>

            {selectedResponsibleId && selectedResponsibleId !== businessDetails?.paymentResponsibleUserId && (
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <AlertDescription className="text-sm text-blue-400">
                  Se notificará por email tanto al nuevo responsable como al anterior
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {}
      <MultipliersConfig />
    </div>
  );
};
