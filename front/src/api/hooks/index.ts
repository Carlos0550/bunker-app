// API Hooks
// Centralized hooks for React Query operations

// Products hooks
export {
  useProductsStats,
  useCategories,
  useLowStockProducts,
  useDeletedProducts,
  useInventory,
  useManualProducts,
  useLinkProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useRestoreProduct,
  useUpdateStock,
  useLinkManualProduct,
  useConvertManualProduct,
  useIgnoreManualProduct,
  useUpdateManualProduct,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type InventoryParams,
} from "./useProductsHooks";

// Customers hooks
export {
  useCustomers,
  useAccountsSummary,
  useCustomerMetrics,
  useSaleItems,
  useCreateCustomer,
  useUpdateCustomerNotes,
  useDeleteCustomer,
  useRegisterPayment,
  useUpdateAccountNotes,
  useAddSaleItem,
  useUpdateSaleItem,
  useDeleteSaleItem,
} from "./useCustomersHooks";

// Stock hooks
export {
  useStockProducts,
  useStockLowProducts,
  useStockStats,
  useAllProductsForSelect,
  useStockMovement,
} from "./useStockHooks";

// Reports hooks
export {
  useSalesSummary,
  useTopProducts,
  useSalesChart,
  useRecentSales,
} from "./useReportsHooks";

// Users hooks
export {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "./useUsersHooks";
