import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessApi } from "@/api/services/business";
import { usersApi, User as UserType } from "@/api/services/users";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { handleApiError } from "@/utils/helpers";

export const useBusinessConfig = () => {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [selectedResponsibleId, setSelectedResponsibleId] = useState<string>("");

  
  const { data: businessDetails, isLoading: loadingBusiness } = useQuery({
    queryKey: ["businessDetails", currentUser?.businessId],
    queryFn: () => businessApi.getBusiness(currentUser?.businessId || ""),
    enabled: !!currentUser?.businessId,
  });

  const { data: admins = [] } = useQuery({
    queryKey: ["admins", currentUser?.businessId],
    queryFn: () => usersApi.getUsersByBusiness(currentUser?.businessId || ""),
    enabled: !!currentUser?.businessId,
    select: (data) => data.filter((u: UserType) => u.role === 1),
  });

  
  useEffect(() => {
    if (businessDetails) {
      setContactPhone(businessDetails.contact_phone || "");
      setContactEmail(businessDetails.contact_email || "");
      setBusinessName(businessDetails.name || "");
      setBusinessAddress(businessDetails.address || "");
      setSelectedResponsibleId(businessDetails.paymentResponsibleUserId || "");
    }
  }, [businessDetails]);

  
  const updateContactMutation = useMutation({
    mutationFn: (data: { businessId: string; contact_phone?: string; contact_email?: string }) =>
      businessApi.updateContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessDetails"] });
      toast.success("Datos de contacto actualizados");
    },
    onError: (error) => handleApiError(error, "Error al actualizar contacto"),
  });

  const updateBusinessDataMutation = useMutation({
    mutationFn: (data: { businessId: string; name?: string; address?: string }) =>
      businessApi.updateBusinessData(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["businessDetails"] });
      toast.success(result);
    },
    onError: (error) => handleApiError(error, "Error al actualizar datos del negocio"),
  });

  const setPaymentResponsibleMutation = useMutation({
    mutationFn: (data: { businessId: string; userId: string }) =>
      businessApi.setPaymentResponsible(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessDetails"] });
      toast.success("Responsable de pagos actualizado. Se enviaron notificaciones por email.");
    },
    onError: (error) => handleApiError(error, "Error al cambiar responsable"),
  });

  
  const handleSaveContact = () => {
    if (!currentUser?.businessId) return;
    updateContactMutation.mutate({
      businessId: currentUser.businessId,
      contact_phone: contactPhone || undefined,
      contact_email: contactEmail || undefined,
    });
  };

  const handleSaveBusinessData = () => {
    if (!currentUser?.businessId) return;
    updateBusinessDataMutation.mutate({
      businessId: currentUser.businessId,
      name: businessName || undefined,
      address: businessAddress || undefined,
    });
  };

  const handleSavePaymentResponsible = () => {
    if (!currentUser?.businessId || !selectedResponsibleId) {
      toast.error("Debes seleccionar un administrador");
      return;
    }
    setPaymentResponsibleMutation.mutate({
      businessId: currentUser.businessId,
      userId: selectedResponsibleId,
    });
  };

  return {
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
  };
};
