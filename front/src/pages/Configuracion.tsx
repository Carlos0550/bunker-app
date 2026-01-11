import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessStore } from "@/store/useBusinessStore";
import { subscriptionApi, Plan } from "@/api/services/subscription";
import { 
  Building2, 
  Bell, 
  Shield, 
  CreditCard,
  Printer,
  Mail,
  Save,
  Check,
  Clock,
  AlertTriangle,
  Crown,
  Zap,
  Calendar,
  Receipt,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Configuracion() {
  const { businessData, fetchBusinessData } = useBusinessStore();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  useEffect(() => {
    fetchBusinessData();
  }, [fetchBusinessData]);

  // Queries para suscripción
  const { data: currentPlan, isLoading: loadingCurrentPlan } = useQuery({
    queryKey: ["currentPlan"],
    queryFn: subscriptionApi.getCurrentPlan,
  });

  const { data: paymentHistory, isLoading: loadingPayments } = useQuery({
    queryKey: ["paymentHistory"],
    queryFn: () => subscriptionApi.getPaymentHistory(1, 20),
  });

  const { data: availablePlans, isLoading: loadingPlans } = useQuery({
    queryKey: ["availablePlans"],
    queryFn: subscriptionApi.getAvailablePlans,
  });

  // Mutation para cambiar plan
  const changePlanMutation = useMutation({
    mutationFn: (planId: string) => subscriptionApi.changePlan(planId),
    onSuccess: (result) => {
      toast.success(result.message);
      setShowPlanDialog(false);
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ["currentPlan"] });
      queryClient.invalidateQueries({ queryKey: ["paymentHistory"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al cambiar el plan");
    },
  });

  // Mutation para crear preferencia de Mercado Pago
  const createMercadoPagoPreferenceMutation = useMutation({
    mutationFn: (planId: string) => subscriptionApi.createMercadoPagoPreference(planId),
    onSuccess: (data) => {
      // Redirigir al checkout de Mercado Pago
      const initPoint = process.env.NODE_ENV === 'production' ? data.initPoint : data.sandboxInitPoint;
      window.location.href = initPoint;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al crear el pago");
    },
  });

  const handlePayWithMercadoPago = () => {
    if (!currentPlan?.plan?.id) {
      toast.error("No hay un plan disponible para pagar");
      return;
    }
    createMercadoPagoPreferenceMutation.mutate(currentPlan.plan.id);
  };

  const handleSave = () => {
    toast.success("Configuración guardada");
  };

  const handleSelectPlan = (plan: Plan) => {
    if (currentPlan?.plan?.id === plan.id) {
      toast.info("Ya tienes este plan activo");
      return;
    }
    setSelectedPlan(plan);
    setShowPlanDialog(true);
  };

  const handleConfirmPlanChange = () => {
    if (selectedPlan) {
      changePlanMutation.mutate(selectedPlan.id);
    }
  };

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  // Obtener badge de estado de suscripción
  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" /> Activo</Badge>;
      case "trial":
        return <Badge className="bg-blue-500/20 text-blue-400"><Clock className="w-3 h-3 mr-1" /> Período de Prueba</Badge>;
      case "grace_period":
        return <Badge className="bg-yellow-500/20 text-yellow-400"><AlertTriangle className="w-3 h-3 mr-1" /> Período de Gracia</Badge>;
      case "expired":
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="w-3 h-3 mr-1" /> Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Obtener badge de estado de pago
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-500/20 text-green-400">Pagado</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pendiente</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500/20 text-red-400">Fallido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayout title="Configuración">
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">
            Administra las preferencias del sistema y tu suscripción
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="suscripcion" className="space-y-6">
          <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="suscripcion" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Suscripción</span>
            </TabsTrigger>
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

          {/* Tab Suscripción */}
          <TabsContent value="suscripcion" className="space-y-6">
            {/* Estado actual del plan */}
            <div className="bunker-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Tu Plan Actual
              </h3>
              
              {loadingCurrentPlan ? (
                <div className="space-y-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-10" />
                </div>
              ) : currentPlan ? (
                <div className="space-y-6">
                  {/* Info del plan */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/20">
                        <Zap className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-foreground">
                          {currentPlan.plan?.name || "Sin Plan"}
                        </h4>
                        <p className="text-muted-foreground">
                          {currentPlan.plan?.description || "No tienes un plan activo"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">
                        {currentPlan.plan ? formatCurrency(currentPlan.plan.price) : "$0"}
                        <span className="text-sm font-normal text-muted-foreground">/mes</span>
                      </p>
                    </div>
                  </div>

                  {/* Estado de suscripción */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-secondary/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Estado</p>
                      {getSubscriptionBadge(currentPlan.subscription.status)}
                    </div>
                    <div className="p-4 bg-secondary/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        {currentPlan.subscription.daysRemaining < 0 ? "Días Vencidos" : "Días Restantes"}
                      </p>
                      <p className={`text-xl font-bold ${
                        currentPlan.subscription.daysRemaining < 0 ? "text-red-400" : "text-foreground"
                      }`}>
                        {currentPlan.subscription.daysRemaining < 0
                          ? `Vencido hace ${Math.abs(currentPlan.subscription.daysRemaining)} día(s)`
                          : `${currentPlan.subscription.daysRemaining} día(s)`
                        }
                      </p>
                    </div>
                    <div className="p-4 bg-secondary/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Próximo Pago</p>
                      <p className="text-lg font-medium text-foreground">
                        {currentPlan.subscription.nextPaymentDate 
                          ? format(new Date(currentPlan.subscription.nextPaymentDate), "dd MMM yyyy", { locale: es })
                          : "No programado"
                        }
                      </p>
                    </div>
                  </div>

                  {/* Características del plan */}
                  {currentPlan.plan && currentPlan.plan.features.length > 0 && (
                    <div>
                      <h5 className="font-medium text-foreground mb-3">Incluye:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {currentPlan.plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-success" />
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alerta si está en período de gracia o expirado */}
                  {(currentPlan.subscription.status === "grace_period" || currentPlan.subscription.status === "expired") && (
                    <div className={`p-4 rounded-lg border ${
                      currentPlan.subscription.status === "expired" 
                        ? "bg-red-500/10 border-red-500/30" 
                        : "bg-yellow-500/10 border-yellow-500/30"
                    }`}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                          currentPlan.subscription.status === "expired" ? "text-red-400" : "text-yellow-400"
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {currentPlan.subscription.status === "expired" 
                              ? "Tu suscripción ha expirado"
                              : "Tu pago está vencido"
                            }
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">
                            {currentPlan.subscription.status === "expired" 
                              ? `Tu suscripción venció hace ${Math.abs(currentPlan.subscription.daysRemaining)} día(s). Por favor, renueva tu suscripción para continuar usando el sistema.`
                              : currentPlan.subscription.daysRemaining < 0
                              ? `Tu suscripción venció hace ${Math.abs(currentPlan.subscription.daysRemaining)} día(s). Tienes ${3 + currentPlan.subscription.daysRemaining} día(s) para regularizar tu pago.`
                              : `Tienes ${currentPlan.subscription.daysRemaining} día(s) para regularizar tu pago.`
                            }
                          </p>
                          <Button
                            onClick={handlePayWithMercadoPago}
                            disabled={createMercadoPagoPreferenceMutation.isPending}
                            className="w-full sm:w-auto bunker-glow"
                          >
                            {createMercadoPagoPreferenceMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Pagar con Mercado Pago
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botón de pago si está en trial o cerca de expirar */}
                  {(currentPlan.subscription.status === "trial" || 
                    (currentPlan.subscription.status === "active" && currentPlan.subscription.daysRemaining <= 7)) && (
                    <div className={`p-4 rounded-lg border ${
                      currentPlan.subscription.daysRemaining < 0
                        ? "border-red-500/30 bg-red-500/5"
                        : currentPlan.subscription.daysRemaining === 0
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : "border-primary/30 bg-primary/5"
                    }`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-foreground mb-1">
                            {currentPlan.subscription.status === "trial" 
                              ? "Prueba gratuita activa"
                              : currentPlan.subscription.daysRemaining < 0
                              ? "Tu suscripción está vencida"
                              : currentPlan.subscription.daysRemaining === 0
                              ? "Tu suscripción vence hoy"
                              : "Tu suscripción está por vencer"
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {currentPlan.subscription.status === "trial" 
                              ? `Quedan ${currentPlan.subscription.daysRemaining} días de prueba. Paga ahora para continuar sin interrupciones.`
                              : currentPlan.subscription.daysRemaining < 0
                              ? `Tu suscripción está vencida hace ${Math.abs(currentPlan.subscription.daysRemaining)} día(s). Renueva ahora para reactivar tu acceso.`
                              : currentPlan.subscription.daysRemaining === 0
                              ? "Tu suscripción vence hoy. Renueva ahora para evitar interrupciones."
                              : `Renueva tu suscripción antes de que expire en ${currentPlan.subscription.daysRemaining} día(s).`
                            }
                          </p>
                        </div>
                        <Button
                          onClick={handlePayWithMercadoPago}
                          disabled={createMercadoPagoPreferenceMutation.isPending}
                          className="w-full sm:w-auto bunker-glow"
                        >
                          {createMercadoPagoPreferenceMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pagar Suscripción
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No se pudo cargar la información del plan</p>
              )}
            </div>

            {/* Planes Disponibles
            <div className="bunker-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Planes Disponibles
              </h3>

              {loadingPlans ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              ) : availablePlans && availablePlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availablePlans.map((plan) => {
                    const isCurrentPlan = currentPlan?.plan?.id === plan.id;
                    
                    return (
                      <div
                        key={plan.id}
                        className={`relative p-6 rounded-xl border-2 transition-all ${
                          isCurrentPlan 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {isCurrentPlan && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground">
                              Plan Actual
                            </Badge>
                          </div>
                        )}

                        <div className="text-center mb-4">
                          <h4 className="text-xl font-bold text-foreground">{plan.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                        </div>

                        <div className="text-center mb-6">
                          <span className="text-4xl font-bold text-foreground">
                            {formatCurrency(plan.price)}
                          </span>
                          <span className="text-muted-foreground">/mes</span>
                        </div>

                        <div className="space-y-2 mb-6">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-success flex-shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          className={`w-full ${isCurrentPlan ? "" : "bunker-glow"}`}
                          variant={isCurrentPlan ? "outline" : "default"}
                          disabled={isCurrentPlan}
                          onClick={() => handleSelectPlan(plan)}
                        >
                          {isCurrentPlan ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Seleccionado
                            </>
                          ) : (
                            <>
                              Seleccionar
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay planes disponibles en este momento
                </p>
              )}
            </div> */}

            {/* Historial de Pagos */}
            <div className="bunker-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Historial de Pagos
              </h3>

              {loadingPayments ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : paymentHistory && paymentHistory.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Próximo Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.data.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {format(new Date(payment.date), "dd MMM yyyy", { locale: es })}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell>
                            {payment.isTrial ? (
                              <Badge variant="outline" className="text-blue-400">Prueba</Badge>
                            ) : (
                              <Badge variant="outline">Suscripción</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {payment.nextPaymentDate 
                              ? format(new Date(payment.nextPaymentDate), "dd MMM yyyy", { locale: es })
                              : "-"
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">No hay pagos registrados</p>
                </div>
              )}
            </div>
          </TabsContent>

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

        {/* Save Button - solo para tabs que no son suscripción */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bunker-glow">
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Dialog de confirmación de cambio de plan */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
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
              onClick={() => setShowPlanDialog(false)}
              disabled={changePlanMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmPlanChange}
              disabled={changePlanMutation.isPending}
              className="bunker-glow"
            >
              {changePlanMutation.isPending ? (
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
    </MainLayout>
  );
}
