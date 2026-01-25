import {
  Crown,
  Zap,
  Check,
  AlertTriangle,
  CreditCard,
  Loader2,
  Receipt,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSubscription } from "@/hooks/configuracion/useSubscription";
import { formatCurrency } from "@/utils/helpers";
import { PlanChangeDialog } from "@/components/configuracion/PlanChangeDialog";

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

export const SubscriptionTab = () => {
    const {
        currentPlan,
        loadingCurrentPlan,
        paymentHistory,
        loadingPayments,
        createMercadoPagoPreferenceMutation,
        handlePayWithMercadoPago,
        showPlanDialog,
        setShowPlanDialog,
        selectedPlan,
        handleConfirmPlanChange,
        changePlanMutation
    } = useSubscription();

  return (
    <div className="space-y-4 sm:space-y-6">
      {}
      <div className="bunker-card p-4 sm:p-6 w-full max-w-full overflow-hidden" data-tour="config-plan">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
          Tu Plan Actual
        </h3>

        {loadingCurrentPlan ? (
          <div className="space-y-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-10" />
          </div>
        ) : currentPlan ? (
          <div className="space-y-6">
            {}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 sm:p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="p-2 sm:p-3 rounded-xl bg-primary/20 shrink-0">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    {currentPlan.plan?.name || "Sin Plan"}
                  </h4>
                  <p className="text-sm sm:text-base text-muted-foreground truncate">
                    {currentPlan.plan?.description || "No tienes un plan activo"}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-2xl sm:text-3xl font-bold text-primary whitespace-nowrap">
                  {currentPlan.plan ? formatCurrency(currentPlan.plan.price) : "$0"}
                  <span className="text-xs sm:text-sm font-normal text-muted-foreground">/mes</span>
                </p>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4" data-tour="config-status">
              <div className="p-3 sm:p-4 bg-secondary/20 rounded-lg min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Estado</p>
                <div className="shrink-0">{getSubscriptionBadge(currentPlan.subscription.status)}</div>
              </div>
              <div className="p-3 sm:p-4 bg-secondary/20 rounded-lg min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  {currentPlan.subscription.daysRemaining < 0 ? "Días Vencidos" : "Días Restantes"}
                </p>
                <p className={`text-lg sm:text-xl font-bold truncate ${currentPlan.subscription.daysRemaining < 0 ? "text-red-400" : "text-foreground"
                  }`}>
                  {currentPlan.subscription.daysRemaining < 0
                    ? `Vencido hace ${Math.abs(currentPlan.subscription.daysRemaining)} día(s)`
                    : `${currentPlan.subscription.daysRemaining} día(s)`
                  }
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-secondary/20 rounded-lg min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Próximo Pago</p>
                <p className="text-base sm:text-lg font-medium text-foreground truncate">
                  {currentPlan.subscription.nextPaymentDate
                    ? format(new Date(currentPlan.subscription.nextPaymentDate), "dd MMM yyyy", { locale: es })
                    : "No programado"
                  }
                </p>
              </div>
            </div>

            {}
            {currentPlan.plan && currentPlan.plan.features.length > 0 && (
              <div>
                <h5 className="font-medium text-sm sm:text-base text-foreground mb-2 sm:mb-3">Incluye:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPlan.plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success shrink-0" />
                      <span className="text-muted-foreground truncate">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            {(currentPlan.subscription.status === "grace_period" || currentPlan.subscription.status === "expired") && (
              <div className={`p-3 sm:p-4 rounded-lg border ${currentPlan.subscription.status === "expired"
                ? "bg-red-500/10 border-red-500/30"
                : "bg-yellow-500/10 border-yellow-500/30"
                }`}>
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 ${currentPlan.subscription.status === "expired" ? "text-red-400" : "text-yellow-400"
                    }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-foreground">
                      {currentPlan.subscription.status === "expired"
                        ? "Tu suscripción ha expirado"
                        : "Tu pago está vencido"
                      }
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
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
                      className="w-full sm:w-auto bunker-glow text-sm sm:text-base"
                    >
                      {createMercadoPagoPreferenceMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Pagar con Mercado Pago</span>
                          <span className="sm:hidden">Pagar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {}
            {(currentPlan.subscription.status === "trial" ||
              (currentPlan.subscription.status === "active" && currentPlan.subscription.daysRemaining <= 7)) && (
                <div className={`p-3 sm:p-4 rounded-lg border ${currentPlan.subscription.daysRemaining < 0
                  ? "border-red-500/30 bg-red-500/5"
                  : currentPlan.subscription.daysRemaining === 0
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-primary/30 bg-primary/5"
                  }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base text-foreground mb-1">
                        {currentPlan.subscription.status === "trial"
                          ? "Prueba gratuita activa"
                          : currentPlan.subscription.daysRemaining < 0
                            ? "Tu suscripción está vencida"
                            : currentPlan.subscription.daysRemaining === 0
                              ? "Tu suscripción vence hoy"
                              : "Tu suscripción está por vencer"
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
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
                      className="w-full sm:w-auto bunker-glow text-sm sm:text-base shrink-0"
                    >
                      {createMercadoPagoPreferenceMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Pagar Suscripción</span>
                          <span className="sm:hidden">Pagar</span>
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

      {}
      <div className="bunker-card p-4 sm:p-6 w-full max-w-full overflow-hidden" data-tour="config-history">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
          Historial de Pagos
        </h3>

        {loadingPayments ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : paymentHistory && paymentHistory.data.length > 0 ? (
          <>
            {}
            <div className="block md:hidden space-y-3">
              {paymentHistory.data.map((payment) => (
                <div
                  key={payment.id}
                  className="bunker-card p-3 border border-border/50 w-full max-w-full overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                          {format(new Date(payment.date), "dd MMM yyyy", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {getPaymentStatusBadge(payment.status)}
                        {payment.isTrial ? (
                          <Badge variant="outline" className="text-xs text-blue-400">Prueba</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Suscripción</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm sm:text-base">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                  {payment.nextPaymentDate && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Próximo pago: {format(new Date(payment.nextPaymentDate), "dd MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {}
            <div className="hidden md:block overflow-x-auto">
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
          </>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <Receipt className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4 opacity-50" />
            <p className="text-sm sm:text-base text-muted-foreground">No hay pagos registrados</p>
          </div>
        )}
      </div>

      <PlanChangeDialog
        open={showPlanDialog}
        onOpenChange={setShowPlanDialog}
        selectedPlan={selectedPlan}
        onConfirm={handleConfirmPlanChange}
        isPending={changePlanMutation.isPending}
      />
    </div>
  );
};
