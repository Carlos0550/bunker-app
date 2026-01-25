import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, Product } from "@/api/services/products";
import {
  analyticsApi,
  LowStockProduct,
  DashboardStats,
} from "@/api/services/analytics";
import { toast } from "sonner";


export function useStockProducts(
  search: string,
  page: number,
  limit: number = 10,
) {
  return useQuery({
    queryKey: ["stockProducts", search, page, limit],
    queryFn: () =>
      productsApi.getProducts({ search: search || undefined }, { page, limit }),
    staleTime: 30000,
  });
}

export function useStockLowProducts() {
  return useQuery({
    queryKey: ["lowStockProducts"],
    queryFn: () => analyticsApi.getLowStockProducts(),
    staleTime: 60000,
  });
}

export function useStockStats() {
  return useQuery({
    queryKey: ["stockStats"],
    queryFn: () => analyticsApi.getDashboardStats(),
    staleTime: 60000,
  });
}

export function useAllProductsForSelect() {
  return useQuery({
    queryKey: ["allProductsForSelect"],
    queryFn: () =>
      productsApi.getProducts({ state: "ACTIVE" }, { page: 1, limit: 500 }),
    staleTime: 60000,
  });
}


export function useStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      productId: string;
      quantity: number;
      type: "in" | "out" | "adjustment";
      currentStock: number;
    }) => {
      let newStock = data.currentStock;

      if (data.type === "in") {
        newStock = data.currentStock + data.quantity;
      } else if (data.type === "out") {
        newStock = data.currentStock - data.quantity;
        if (newStock < 0) throw new Error("Stock insuficiente");
      } else {
        newStock = data.quantity; 
      }

      return productsApi.updateProduct(data.productId, { stock: newStock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockProducts"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
      queryClient.invalidateQueries({ queryKey: ["allProductsForSelect"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Stock actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar stock");
    },
  });
}
