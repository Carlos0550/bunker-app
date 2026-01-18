import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  customersApi,
  BusinessCustomer,
  CurrentAccount,
  CustomerMetrics,
  SaleItem,
  SaleWithItems,
  CreateCustomerData,
  AddSaleItemData,
  UpdateSaleItemData,
} from "../services/customers";

// ============================================================================
// Query Keys
// ============================================================================

export const customerKeys = {
  all: ["customers"] as const,
  list: (search?: string) => [...customerKeys.all, "list", search] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
  metrics: (id: string) => [...customerKeys.all, "metrics", id] as const,
  accountsSummary: () => ["accountsSummary"] as const,
  saleItems: (saleId: string) => ["saleItems", saleId] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Hook para obtener listado de clientes con búsqueda
 */
export function useCustomers(search?: string) {
  return useQuery({
    queryKey: customerKeys.list(search),
    queryFn: () =>
      customersApi.getCustomers({
        search: search || undefined,
        page: 1,
        limit: 100,
      }),
  });
}

/**
 * Hook para obtener resumen de cuentas corrientes
 */
export function useAccountsSummary() {
  return useQuery({
    queryKey: customerKeys.accountsSummary(),
    queryFn: () => customersApi.getAccountsSummary(),
  });
}

/**
 * Hook para obtener métricas de un cliente específico
 */
export function useCustomerMetrics(customerId: string | undefined) {
  return useQuery({
    queryKey: customerKeys.metrics(customerId || ""),
    queryFn: () =>
      customerId ? customersApi.getCustomerMetrics(customerId) : null,
    enabled: !!customerId,
  });
}

/**
 * Hook para obtener items de una venta
 */
export function useSaleItems(saleId: string | undefined) {
  return useQuery({
    queryKey: customerKeys.saleItems(saleId || ""),
    queryFn: () => (saleId ? customersApi.getSaleItems(saleId) : null),
    enabled: !!saleId,
  });
}

// ============================================================================
// Customer Mutations
// ============================================================================

/**
 * Hook para crear un nuevo cliente
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerData) => customersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({
        queryKey: customerKeys.accountsSummary(),
      });
      toast.success("Cliente creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al crear cliente",
      );
    },
  });
}

/**
 * Hook para actualizar notas de un cliente
 */
export function useUpdateCustomerNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      customersApi.updateCustomer(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success("Notas actualizadas");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al actualizar notas",
      );
    },
  });
}

/**
 * Hook para eliminar un cliente
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({
        queryKey: customerKeys.accountsSummary(),
      });
      toast.success("Cliente eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al eliminar cliente",
      );
    },
  });
}

// ============================================================================
// Account Mutations
// ============================================================================

/**
 * Hook para registrar un pago en cuenta corriente
 */
export function useRegisterPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      amount,
      paymentMethod,
      notes,
    }: {
      accountId: string;
      amount: number;
      paymentMethod: "CASH" | "CARD" | "TRANSFER" | "OTHER";
      notes?: string;
    }) =>
      customersApi.registerPayment(accountId, { amount, paymentMethod, notes }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({
        queryKey: customerKeys.accountsSummary(),
      });
      toast.success(result.message);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al registrar pago",
      );
    },
  });
}

/**
 * Hook para actualizar notas de una cuenta corriente
 */
export function useUpdateAccountNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, notes }: { accountId: string; notes: string }) =>
      customersApi.updateAccountNotes(accountId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success("Notas actualizadas exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al actualizar notas",
      );
    },
  });
}

// ============================================================================
// Sale Items Mutations
// ============================================================================

/**
 * Hook para agregar item a una venta
 */
export function useAddSaleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ saleId, data }: { saleId: string; data: AddSaleItemData }) =>
      customersApi.addSaleItem(saleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saleItems"] });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success("Item agregado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al agregar item",
      );
    },
  });
}

/**
 * Hook para actualizar item de una venta
 */
export function useUpdateSaleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: UpdateSaleItemData;
    }) => customersApi.updateSaleItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saleItems"] });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success("Item actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al actualizar item",
      );
    },
  });
}

/**
 * Hook para eliminar item de una venta
 */
export function useDeleteSaleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => customersApi.deleteSaleItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saleItems"] });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success("Item eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al eliminar item",
      );
    },
  });
}
