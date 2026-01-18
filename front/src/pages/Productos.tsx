import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Product, Category, productsApi } from "@/api/services/products";
import { ManualProduct } from "@/api/services/sales";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportProductsModal } from "@/components/ImportProductsModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Package,
  Upload,
  AlertTriangle,
  ArrowDownCircle,
  Loader2,
  Search,
  Link2,
} from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Import centralized hooks
import {
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
} from "@/api/hooks";

// Import components
import { LoadingContainer, EmptyState, StatsCard, StatsGrid } from "@/components/shared";
import {
  ProductFormDialog,
  ProductCard,
  ProductTable,
  ProductFilters,
  StockAdjustmentDialog,
  DeletedProductsTab,
  ManualProductsTab,
  CategoryManager,
} from "@/components/productos";

type SortOption = "price_asc" | "price_desc" | "stock_asc" | "stock_desc" | "name_asc" | "name_desc";
type StateFilter = "all" | "ACTIVE" | "OUT_OF_STOCK" | "DISABLED";

export default function Productos() {
  // Tab state
  const [activeTab, setActiveTab] = useState("inventario");
  
  // Inventory filters state
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryLowStock, setInventoryLowStock] = useState<boolean | undefined>(undefined);
  const [inventorySortBy, setInventorySortBy] = useState<SortOption | undefined>(undefined);
  const [inventoryState, setInventoryState] = useState<StateFilter>("all");
  const [inventoryCategory, setInventoryCategory] = useState<string>("all");
  const [inventoryLimit, setInventoryLimit] = useState(20);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Product editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockOperation, setStockOperation] = useState<"add" | "subtract" | "set">("add");
  const [stockQuantity, setStockQuantity] = useState(0);
  
  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<"form" | "search">("form");
  const [scannedBarcode, setScannedBarcode] = useState("");
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Category inline creation state
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryInline, setNewCategoryInline] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  
  // Manual products state
  const [selectedManualProduct, setSelectedManualProduct] = useState<ManualProduct | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkProductSearch, setLinkProductSearch] = useState("");
  const [selectedLinkProductId, setSelectedLinkProductId] = useState("");
  const [editManualDialogOpen, setEditManualDialogOpen] = useState(false);
  const [editManualForm, setEditManualForm] = useState({
    name: "",
    quantity: 0,
    price: 0,
  });
  
  // ============================================================================
  // Queries using centralized hooks
  // ============================================================================
  
  const { data: statsData } = useProductsStats();
  const { data: categories = [] } = useCategories();
  const { data: lowStockProducts = [], isLoading: loadingLowStock } = useLowStockProducts();
  const { data: deletedProductsData } = useDeletedProducts();
  
  const { data: inventoryData, isLoading: loadingInventory } = useInventory({
    page: inventoryPage,
    search: inventorySearch,
    lowStock: inventoryLowStock,
    sortBy: inventorySortBy,
    state: inventoryState,
    categoryId: inventoryCategory,
    limit: inventoryLimit,
  }, activeTab === "inventario");
  
  const { data: manualProductsData = [], isLoading: loadingManualProducts } = useManualProducts(activeTab === "manuales");
  
  const { data: linkProductsData, isLoading: loadingLinkProducts } = useLinkProducts(
    linkProductSearch,
    linkDialogOpen
  );
  
  // ============================================================================
  // Mutations using centralized hooks
  // ============================================================================
  
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const restoreMutation = useRestoreProduct();
  const updateStockMutation = useUpdateStock();
  const linkManualMutation = useLinkManualProduct();
  const convertManualMutation = useConvertManualProduct();
  const ignoreManualMutation = useIgnoreManualProduct();
  const updateManualMutation = useUpdateManualProduct();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  
  // ============================================================================
  // Derived data
  // ============================================================================
  
  const statsProducts = statsData?.data || [];
  const statsPagination = statsData?.pagination;
  const deletedProducts = deletedProductsData?.data || [];
  const inventoryProducts = inventoryData?.data || [];
  const inventoryPagination = inventoryData?.pagination;
  const manualProducts = manualProductsData || [];
  const pendingManualProducts = manualProducts.filter(mp => mp.status === "PENDING");
  
  // ============================================================================
  // Barcode Scanner
  // ============================================================================
  
  const barcodeBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);
  
  // Process barcode using dedicated endpoint
  const processBarcodeSearch = async (code: string) => {
    try {
      toast.loading("Buscando producto por código...", { id: "barcode-search" });
      const product = await productsApi.findByBarcode(code);
      toast.dismiss("barcode-search");
      
      if (product) {
        setInventorySearch(product.bar_code || product.sku || product.name);
        setInventoryPage(1);
        toast.success(`Producto encontrado: ${product.name}`);
        
      } else {
        toast.error(`No se encontró producto con código: ${code}`);
        // Clear search immediately if not found
        setInventorySearch("");
      }
    } catch (error) {
      toast.dismiss("barcode-search");
      toast.error("Error al buscar el producto");
      setInventorySearch("");
    }
  };
  
  // Global Key Listener for Scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea or if any input is focused
      const target = e.target as HTMLElement;
      const activeElement = document.activeElement as HTMLElement;
      
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.isContentEditable
      ) {
        return;
      }

      const currentTime = Date.now();
      
      // If time between keys is too long, reset buffer (manual typing vs scanner)
      if (currentTime - lastKeyTime.current > 100) {
        barcodeBuffer.current = "";
      }
      
      lastKeyTime.current = currentTime;

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length > 2) {
          // Scanner detected barcode - use dedicated barcode endpoint
          e.preventDefault(); // Prevent form submission
          processBarcodeSearch(barcodeBuffer.current);
          barcodeBuffer.current = "";
        }
      } else if (e.key.length === 1) {
        // Collect printable characters
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  // Reset page when filters change
  useEffect(() => {
    setInventoryPage(1);
  }, [inventorySearch, inventoryLowStock, inventorySortBy, inventoryState, inventoryCategory]);
  
  // Close dialog on successful mutation
  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) {
      setIsDialogOpen(false);
      setEditingProduct(null);
      setSelectedImage(null);
      setImagePreview(null);
      setScannedBarcode("");
      setSelectedCategoryId("");
      setIsCreatingNewCategory(false);
      setNewCategoryInline("");
    }
  }, [createMutation.isSuccess, updateMutation.isSuccess]);
  
  useEffect(() => {
    if (updateStockMutation.isSuccess) {
      setIsStockDialogOpen(false);
      setStockProduct(null);
      setStockQuantity(0);
    }
  }, [updateStockMutation.isSuccess]);
  
  useEffect(() => {
    if (linkManualMutation.isSuccess) {
      setLinkDialogOpen(false);
      setSelectedManualProduct(null);
      setSelectedLinkProductId("");
      setLinkProductSearch("");
    }
  }, [linkManualMutation.isSuccess]);
  
  // ============================================================================
  // Handlers
  // ============================================================================
  
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setScannedBarcode("");
    setSelectedCategoryId("");
    setSelectedImage(null);
    setImagePreview(null);
    setIsCreatingNewCategory(false);
    setNewCategoryInline("");
    setIsDialogOpen(true);
  };
  
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setScannedBarcode(product.bar_code || "");
    setSelectedCategoryId(product.categoryId || "");
    setSelectedImage(null);
    setImagePreview(product.imageUrl || null);
    setIsCreatingNewCategory(false);
    setNewCategoryInline("");
    setIsDialogOpen(true);
  };
  
  const handleAdjustStock = (product: Product) => {
    setStockProduct(product);
    setStockQuantity(0);
    setStockOperation("add");
    setIsStockDialogOpen(true);
  };
  
  const handleToggleState = (product: Product) => {
    const newState = product.state === "DISABLED" ? "ACTIVE" : "DISABLED";
    updateMutation.mutate({
      id: product.id,
      data: { state: newState },
    });
  };
  
  const handleDeleteProduct = (product: Product) => {
    if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };
  
  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string || undefined,
      bar_code: formData.get("barcode") as string || undefined,
      categoryId: formData.get("category") as string || undefined,
      sale_price: formData.get("price") ? Number(formData.get("price")) : undefined,
      cost_price: formData.get("cost") ? Number(formData.get("cost")) : undefined,
      stock: formData.get("stock") ? Number(formData.get("stock")) : 0,
      min_stock: formData.get("minStock") ? Number(formData.get("minStock")) : 5,
      description: formData.get("description") as string || undefined,
    };
    
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data, image: selectedImage || undefined });
    } else {
      createMutation.mutate({ data, image: selectedImage || undefined });
    }
  };
  
  const handleStockUpdate = () => {
    if (stockProduct && stockQuantity >= 0) {
      updateStockMutation.mutate({
        id: stockProduct.id,
        quantity: stockQuantity,
        operation: stockOperation,
      });
    }
  };
  
  const handleCreateCategoryInline = (name: string) => {
    createCategoryMutation.mutate(name, {
      onSuccess: (newCategory) => {
        setSelectedCategoryId(newCategory.id);
        setIsCreatingNewCategory(false);
        setNewCategoryInline("");
      },
    });
  };
  
  const handleScanResult = async (code: string) => {
    if (scannerMode === "form") {
      try {
        const existingProduct = await productsApi.findByBarcode(code);
        if (existingProduct) {
          handleEditProduct(existingProduct);
          setScannerOpen(false);
          toast.success(`Producto encontrado: ${existingProduct.name}. Puedes editarlo.`);
        } else {
          setScannedBarcode(code);
          setScannerOpen(false);
          toast.success(`Código escaneado: ${code}. Completa los datos del producto.`);
        }
      } catch {
        setScannedBarcode(code);
        setScannerOpen(false);
        toast.success(`Código escaneado: ${code}`);
      }
    } else {
      try {
        const product = await productsApi.findByBarcode(code);
        if (product) {
          setActiveTab("inventario");
          setInventorySearch(code);
          setInventoryPage(1);
          setInventoryCategory("all");
          setInventoryState("all");
          setInventoryLowStock(undefined);
          toast.success(`Producto encontrado: ${product.name}`);
        } else {
          toast.error("No se encontró ningún producto con ese código de barras");
        }
      } catch {
        toast.error("No se encontró ningún producto con ese código de barras");
      }
    }
  };
  
  const handleClearFilters = () => {
    setInventoryLowStock(undefined);
    setInventoryState("all");
    setInventoryCategory("all");
    setInventorySortBy(undefined);
  };
  
  // ============================================================================
  // Helper functions
  // ============================================================================
  
  const getStateBadge = (state: string, stock: number, minStock: number) => {
    if (state === "DISABLED") {
      return <Badge variant="secondary">Deshabilitado</Badge>;
    }
    if (state === "OUT_OF_STOCK" || stock <= 0) {
      return <Badge variant="destructive">Sin Stock</Badge>;
    }
    if (stock <= minStock) {
      return <Badge variant="outline" className="border-warning text-warning">Stock Bajo</Badge>;
    }
    return <Badge variant="outline" className="border-success text-success">Activo</Badge>;
  };
  
  // ============================================================================
  // Render
  // ============================================================================
  
  return (
    <MainLayout title="Productos">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestión de Productos</h1>
              <p className="text-sm text-muted-foreground">
                {statsPagination?.total || 0} productos
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3" 
                onClick={() => setIsImportModalOpen(true)} 
                data-tour="productos-import"
              >
                <Upload className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Importar</span>
              </Button>
              <Button 
                size="sm" 
                className="h-8 sm:h-9" 
                onClick={handleOpenNewProduct}
                data-tour="productos-add"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nuevo</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <StatsGrid columns={4} data-tour="productos-stats">
          <StatsCard
            title="Total Productos"
            value={statsPagination?.total || 0}
            icon={Package}
            iconBgColor="bg-primary/20"
            iconColor="text-primary"
          />
          <StatsCard
            title="Valor Inventario"
            value={`$${statsProducts.reduce((acc, p) => acc + (p.sale_price || 0) * p.stock, 0).toLocaleString()}`}
            icon={Package}
            iconBgColor="bg-success/20"
            iconColor="text-success"
          />
          <StatsCard
            title="Stock Bajo"
            value={lowStockProducts.length}
            icon={AlertTriangle}
            iconBgColor="bg-warning/20"
            iconColor="text-warning"
          />
          <StatsCard
            title="Sin Stock"
            value={statsProducts.filter(p => p.stock <= 0).length}
            icon={Package}
            iconBgColor="bg-destructive/20"
            iconColor="text-destructive"
          />
        </StatsGrid>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-grid">
            <TabsTrigger value="inventario" className="text-xs sm:text-sm">Inventario</TabsTrigger>
            <TabsTrigger value="bajo-stock" className="text-xs sm:text-sm">
              Bajo Stock
              {lowStockProducts.length > 0 && (
                <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs px-1.5 py-0">
                  {lowStockProducts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="categorias" className="text-xs sm:text-sm">Categorías</TabsTrigger>
            <TabsTrigger value="manuales" className="text-xs sm:text-sm relative">
              Manuales
              {pendingManualProducts.length > 0 && (
                <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs px-1.5 py-0">
                  {pendingManualProducts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Inventario Tab */}
          <TabsContent value="inventario" className="space-y-4">
            <ProductFilters
              search={inventorySearch}
              onSearchChange={setInventorySearch}
              lowStock={inventoryLowStock}
              onLowStockChange={setInventoryLowStock}
              state={inventoryState}
              onStateChange={setInventoryState}
              categoryId={inventoryCategory}
              onCategoryChange={setInventoryCategory}
              sortBy={inventorySortBy}
              onSortChange={setInventorySortBy}
              categories={categories}
              onScanClick={() => {
                setScannerMode("search");
                setScannerOpen(true);
              }}
              onClearFilters={handleClearFilters}
            />
            
            {loadingInventory ? (
              <LoadingContainer className="p-12" />
            ) : inventoryProducts.length === 0 ? (
              <div className="bunker-card">
                <EmptyState
                  icon={Package}
                  title="No hay productos"
                  description={inventorySearch ? "No se encontraron productos con ese criterio" : "Agrega tu primer producto"}
                  action={
                    !inventorySearch && (
                      <Button onClick={handleOpenNewProduct}>
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Producto
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              <>
                {/* Top Pagination/Selector */}
                {inventoryPagination && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pb-2">
                    <div className="flex items-center gap-2">
                      <span>Mostrar:</span>
                      <Select
                        value={inventoryLimit.toString()}
                        onValueChange={(v) => {
                          setInventoryLimit(Number(v));
                          setInventoryPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={inventoryLimit} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p>
                      Mostrando {inventoryProducts.length} de {inventoryPagination.total} productos
                    </p>
                  </div>
                )}

                {/* Mobile view */}
                <div className="md:hidden space-y-2">
                  {inventoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdjustStock={handleAdjustStock}
                      onEdit={handleEditProduct}
                      onToggleState={handleToggleState}
                      onDelete={handleDeleteProduct}
                      getStateBadge={getStateBadge}
                    />
                  ))}
                </div>
                
                {/* Desktop view */}
                <div className="bunker-card overflow-hidden">
                  
                  <ProductTable
                    products={inventoryProducts}
                    onAdjustStock={handleAdjustStock}
                    onEdit={handleEditProduct}
                    onToggleState={handleToggleState}
                    onDelete={handleDeleteProduct}
                    getStateBadge={getStateBadge}
                  />
                </div>
                
                {/* Bottom Pagination */}
                {inventoryPagination && inventoryPagination.totalPages > 1 && (
                  <div className="flex justify-center sm:justify-end mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setInventoryPage(p => Math.max(1, p - 1))}
                            className={inventoryPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {/* Page numbers logic */}
                        {Array.from({ length: Math.min(5, inventoryPagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (inventoryPagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else {
                            if (inventoryPage <= 3) {
                              pageNum = i + 1;
                            } else if (inventoryPage >= inventoryPagination.totalPages - 2) {
                              pageNum = inventoryPagination.totalPages - 4 + i;
                            } else {
                              pageNum = inventoryPage - 2 + i;
                            }
                          }
                          
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={inventoryPage === pageNum}
                                onClick={() => setInventoryPage(pageNum)}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        {inventoryPagination.totalPages > 5 && inventoryPage < inventoryPagination.totalPages - 2 && (
                          <>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink 
                                onClick={() => setInventoryPage(inventoryPagination.totalPages)}
                                className="cursor-pointer"
                              >
                                {inventoryPagination.totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}

                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setInventoryPage(p => Math.min(inventoryPagination.totalPages, p + 1))}
                            className={inventoryPage >= inventoryPagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {/* Bajo Stock Tab */}
          <TabsContent value="bajo-stock" className="space-y-4">
            {loadingLowStock ? (
              <LoadingContainer className="p-12" />
            ) : lowStockProducts.length === 0 ? (
              <div className="bunker-card">
                <EmptyState
                  icon={Package}
                  title="Sin productos con stock bajo"
                  description="Todos los productos tienen stock suficiente"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="bunker-card p-4 border-l-4 border-warning">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock: <span className="font-bold text-warning">{product.stock}</span> 
                          {" / Mínimo: "}{product.min_stock}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdjustStock(product)}
                      >
                        <ArrowDownCircle className="w-4 h-4 mr-1" />
                        Reponer Stock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Categorías Tab */}
          <TabsContent value="categorias" className="space-y-4">
            <CategoryManager
              categories={categories}
              products={statsProducts}
              onCreateCategory={(name) => createCategoryMutation.mutate(name)}
              onUpdateCategory={(id, name) => updateCategoryMutation.mutate({ id, name })}
              onDeleteCategory={(id) => deleteCategoryMutation.mutate(id)}
              isCreating={createCategoryMutation.isPending}
              isUpdating={updateCategoryMutation.isPending}
              isDeleting={deleteCategoryMutation.isPending}
            />
          </TabsContent>
          
          {/* Manuales Tab */}
          <TabsContent value="manuales" className="space-y-4">
            <ManualProductsTab
              products={manualProducts}
              isLoading={loadingManualProducts}
              onEdit={(mp) => {
                setSelectedManualProduct(mp);
                setEditManualForm({
                  name: mp.name,
                  quantity: mp.quantity,
                  price: mp.price,
                });
                setEditManualDialogOpen(true);
              }}
              onLink={(mp) => {
                setSelectedManualProduct(mp);
                setLinkDialogOpen(true);
              }}
              onConvert={(id) => convertManualMutation.mutate(id)}
              onIgnore={(id) => ignoreManualMutation.mutate(id)}
              convertLoading={convertManualMutation.isPending}
              ignoreLoading={ignoreManualMutation.isPending}
            />
          </TabsContent>
        </Tabs>
        
        {/* Papelera - Floating button or separate tab */}
        {deletedProducts.length > 0 && (
          <div className="bunker-card p-4">
            <h3 className="text-lg font-semibold mb-4">Papelera ({deletedProducts.length})</h3>
            <DeletedProductsTab
              products={deletedProducts}
              onRestore={(id) => restoreMutation.mutate(id)}
              isLoading={restoreMutation.isPending}
            />
          </div>
        )}
        
        {/* Product Form Dialog */}
        <ProductFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingProduct={editingProduct}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          isCreatingNewCategory={isCreatingNewCategory}
          setIsCreatingNewCategory={setIsCreatingNewCategory}
          newCategoryInline={newCategoryInline}
          setNewCategoryInline={setNewCategoryInline}
          scannedBarcode={scannedBarcode}
          setScannedBarcode={setScannedBarcode}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
          onOpenScanner={() => {
            setScannerMode("form");
            setScannerOpen(true);
          }}
          onCreateCategory={handleCreateCategoryInline}
          onSave={handleSaveProduct}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isCreatingCategory={createCategoryMutation.isPending}
        />
        
        {/* Stock Adjustment Dialog */}
        <StockAdjustmentDialog
          open={isStockDialogOpen}
          onOpenChange={setIsStockDialogOpen}
          product={stockProduct}
          stockQuantity={stockQuantity}
          setStockQuantity={setStockQuantity}
          stockOperation={stockOperation}
          setStockOperation={setStockOperation}
          onSave={handleStockUpdate}
          isLoading={updateStockMutation.isPending}
        />
        
        {/* Link Manual Product Dialog */}
        <Dialog 
          open={linkDialogOpen} 
          onOpenChange={(open) => {
            setLinkDialogOpen(open);
            if (!open) {
              setLinkProductSearch("");
              setSelectedLinkProductId("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular Producto</DialogTitle>
              <DialogDescription>
                Vincula "{selectedManualProduct?.name}" a un producto existente en tu catálogo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Producto manual:</p>
                <p className="font-medium">{selectedManualProduct?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Precio: ${selectedManualProduct?.price.toLocaleString()} | Cantidad: {selectedManualProduct?.quantity}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Buscar producto del catálogo</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, SKU o código..."
                    value={linkProductSearch}
                    onChange={(e) => setLinkProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {loadingLinkProducts ? (
                  <LoadingContainer className="py-8" />
                ) : (
                  <div className="border rounded-lg max-h-[300px] overflow-auto">
                    {linkProductsData?.data && linkProductsData.data.length > 0 ? (
                      linkProductsData.data.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedLinkProductId(p.id)}
                          className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b last:border-b-0 ${
                            selectedLinkProductId === p.id ? "bg-primary/10 border-l-2 border-primary" : ""
                          }`}
                        >
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${p.sale_price?.toLocaleString() || 0} • Stock: {p.stock}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          {linkProductSearch ? "No se encontraron productos" : "Ingresa un término de búsqueda"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedManualProduct && selectedLinkProductId) {
                    linkManualMutation.mutate({
                      manualId: selectedManualProduct.id,
                      productId: selectedLinkProductId,
                    });
                  }
                }}
                disabled={!selectedLinkProductId || linkManualMutation.isPending}
              >
                {linkManualMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Link2 className="w-4 h-4 mr-2" />
                Vincular
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Manual Product Dialog */}
        <Dialog open={editManualDialogOpen} onOpenChange={setEditManualDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Editar Producto Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editManualForm.name}
                  onChange={(e) => setEditManualForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={editManualForm.quantity}
                    onChange={(e) => setEditManualForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    value={editManualForm.price}
                    onChange={(e) => setEditManualForm(f => ({ ...f, price: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditManualDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedManualProduct) {
                    updateManualMutation.mutate({
                      id: selectedManualProduct.id,
                      data: editManualForm,
                    }, {
                      onSuccess: () => {
                        setEditManualDialogOpen(false);
                        setSelectedManualProduct(null);
                      },
                    });
                  }
                }}
                disabled={updateManualMutation.isPending}
              >
                {updateManualMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Import Modal */}
        <ImportProductsModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
        />
        
        {/* Barcode Scanner */}
        <BarcodeScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          title={scannerMode === "form" ? "Escanear Código de Barras" : "Buscar Producto por Código"}
          onScan={handleScanResult}
        />
      </div>
    </MainLayout>
  );
}
