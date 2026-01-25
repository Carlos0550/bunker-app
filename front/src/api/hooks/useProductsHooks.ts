import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  productsApi,
  Product,
  ProductFilters,
  PaginationOptions,
  CreateProductData,
  UpdateProductData,
  Category,
} from "../services/products";
import { salesApi, ManualProduct } from "../services/sales";


export const productKeys = {
  all: ["products"] as const,
  stats: () => [...productKeys.all, "stats"] as const,
  inventory: (params: any) =>
    [...productKeys.all, "inventory", params] as const,
  deletedProducts: () => [...productKeys.all, "deleted"] as const,
  lowStock: () => [...productKeys.all, "lowStock"] as const,
  categories: () => ["categories"] as const,
  manualProducts: () => ["manualProducts"] as const,
  linkProducts: (search: string) => ["linkProducts", search] as const,
};


export function useProductsStats() {
  return useQuery({
    queryKey: productKeys.stats(),
    queryFn: () => productsApi.getProducts({}, { page: 1, limit: 10000 }),
  });
}


export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => productsApi.getCategories(),
  });
}


export function useLowStockProducts() {
  return useQuery({
    queryKey: productKeys.lowStock(),
    queryFn: () => productsApi.getLowStockProducts(),
  });
}


export function useDeletedProducts(enabled: boolean = true) {
  return useQuery({
    queryKey: productKeys.deletedProducts(),
    queryFn: () => productsApi.getDeletedProducts({ page: 1, limit: 50 }),
    enabled,
  });
}

export interface InventoryParams {
  page: number;
  search: string;
  lowStock?: boolean;
  sortBy?:
    | "price_asc"
    | "price_desc"
    | "stock_asc"
    | "stock_desc"
    | "name_asc"
    | "name_desc";
  state?: "all" | "ACTIVE" | "OUT_OF_STOCK" | "DISABLED";
  categoryId?: string;
  limit?: number;
}


export function useInventory(params: InventoryParams, enabled: boolean = true) {
  const { page, search, lowStock, sortBy, state, categoryId, limit } = params;

  return useQuery({
    queryKey: productKeys.inventory({
      page,
      search,
      lowStock,
      sortBy,
      state,
      categoryId,
      limit,
    }),
    queryFn: () => {
      const filters: ProductFilters = {
        search: search || undefined,
        lowStock,
        state: state !== "all" ? state : undefined,
        categoryId: categoryId !== "all" ? categoryId : undefined,
      };

      
      let sortByField: string | undefined;
      let sortOrder: "asc" | "desc" | undefined;

      if (sortBy) {
        if (sortBy === "price_asc") {
          sortByField = "sale_price";
          sortOrder = "asc";
        } else if (sortBy === "price_desc") {
          sortByField = "sale_price";
          sortOrder = "desc";
        } else if (sortBy === "stock_asc") {
          sortByField = "stock";
          sortOrder = "asc";
        } else if (sortBy === "stock_desc") {
          sortByField = "stock";
          sortOrder = "desc";
        } else if (sortBy === "name_asc") {
          sortByField = "name";
          sortOrder = "asc";
        } else if (sortBy === "name_desc") {
          sortByField = "name";
          sortOrder = "desc";
        }
      }

      return productsApi.getProducts(filters, {
        page,
        limit: limit || 15,
        sortBy: sortByField,
        sortOrder,
      });
    },
    enabled,
  });
}


export function useManualProducts(enabled: boolean = true) {
  return useQuery({
    queryKey: productKeys.manualProducts(),
    queryFn: () => salesApi.getManualProducts(),
    enabled,
  });
}


export function useLinkProducts(search: string, enabled: boolean = true) {
  return useQuery({
    queryKey: productKeys.linkProducts(search),
    queryFn: () =>
      productsApi.getProducts(
        { search: search || undefined, state: "ACTIVE" },
        { page: 1, limit: 100 },
      ),
    enabled,
  });
}


export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      image,
    }: {
      data: CreateProductData;
      image?: File;
    }) => {
      const product = await productsApi.createProduct(data);
      if (image) {
        try {
          await productsApi.updateProductImage(product.id, image);
        } catch {
          toast.error(
            "El producto se creó pero hubo un error al subir la imagen",
          );
        }
      }
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      toast.success("Producto creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al crear producto",
      );
    },
  });
}


export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      image,
    }: {
      id: string;
      data: UpdateProductData;
      image?: File;
    }) => {
      const product = await productsApi.updateProduct(id, data);
      if (image) {
        try {
          await productsApi.updateProductImage(product.id, image);
        } catch {
          toast.error(
            "El producto se actualizó pero hubo un error al subir la imagen",
          );
        }
      }
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
      toast.success("Producto actualizado");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al actualizar",
      );
    },
  });
}


export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({
        queryKey: productKeys.deletedProducts(),
      });
      toast.success("Producto movido a papelera");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al eliminar");
    },
  });
}


export function useRestoreProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.restoreProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({
        queryKey: productKeys.deletedProducts(),
      });
      toast.success("Producto restaurado");
    },
  });
}


export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      quantity,
      operation,
    }: {
      id: string;
      quantity: number;
      operation: "add" | "subtract" | "set";
    }) => productsApi.updateStock(id, quantity, operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
      toast.success("Stock actualizado");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al actualizar stock",
      );
    },
  });
}


export function useLinkManualProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      manualId,
      productId,
    }: {
      manualId: string;
      productId: string;
    }) => salesApi.linkManualProduct(manualId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.manualProducts() });
      toast.success("Producto vinculado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al vincular producto",
      );
    },
  });
}


export function useConvertManualProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesApi.convertManualProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.manualProducts() });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Producto convertido y agregado al catálogo");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al convertir producto",
      );
    },
  });
}


export function useIgnoreManualProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesApi.ignoreManualProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.manualProducts() });
      toast.success("Producto ignorado");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al ignorar producto",
      );
    },
  });
}


export function useUpdateManualProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        quantity?: number;
        price?: number;
        status?: string;
      };
    }) => salesApi.updateManualProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.manualProducts() });
      toast.success("Producto manual actualizado");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al actualizar producto",
      );
    },
  });
}


export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => productsApi.createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories() });
      toast.success("Categoría creada exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al crear categoría",
      );
    },
  });
}


export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      productsApi.updateCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories() });
      toast.success("Categoría actualizada");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al actualizar categoría",
      );
    },
  });
}


export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories() });
      toast.success("Categoría eliminada");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al eliminar categoría",
      );
    },
  });
}
