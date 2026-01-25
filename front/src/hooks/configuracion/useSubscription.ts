import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi, Plan } from "@/api/services/subscription";
import { toast } from "sonner";
import { handleApiError } from "@/utils/helpers";

export const useSubscription = () => {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  
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

  
  const changePlanMutation = useMutation({
    mutationFn: (planId: string) => subscriptionApi.changePlan(planId),
    onSuccess: (result) => {
      toast.success(result.message);
      setShowPlanDialog(false);
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ["currentPlan"] });
      queryClient.invalidateQueries({ queryKey: ["paymentHistory"] });
    },
    onError: (error) => handleApiError(error, "Error al cambiar el plan"),
  });

  const createMercadoPagoPreferenceMutation = useMutation({
    mutationFn: (planId: string) => subscriptionApi.createMercadoPagoPreference(planId),
    onSuccess: (data) => {
      const initPoint = process.env.NODE_ENV === 'production' ? data.initPoint : data.sandboxInitPoint;
      window.location.href = initPoint;
    },
    onError: (error) => handleApiError(error, "Error al crear el pago"),
  });

  
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

  const handlePayWithMercadoPago = () => {
    if (!currentPlan?.plan?.id) {
      toast.error("No hay un plan disponible para pagar");
      return;
    }
    createMercadoPagoPreferenceMutation.mutate(currentPlan.plan.id);
  };

  return {
    currentPlan,
    loadingCurrentPlan,
    paymentHistory,
    loadingPayments,
    availablePlans,
    loadingPlans,
    selectedPlan,
    showPlanDialog,
    setShowPlanDialog,
    changePlanMutation,
    createMercadoPagoPreferenceMutation,
    handleSelectPlan,
    handleConfirmPlanChange,
    handlePayWithMercadoPago,
  };
};
