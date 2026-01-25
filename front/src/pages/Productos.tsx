import { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/helpers";
import { MainLayout } from "@/components/layout/MainLayout";
import { productsApi } from "@/api/services/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Search,
  Loader2,
  Link2,
} from "lucide-react";
import { toast } from "sonner";


import {
  useProductsStats,
  useCategories,
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


import { StatsCard, StatsGrid, LoadingContainer } from "@/components/shared";
import {
  ProductFormDialog,
  StockAdjustmentDialog,
  DeletedProductsTab,
  ManualProductsTab,
  CategoryManager,
} from "@/components/productos";

import { useInventoryFilters } from "@/hooks/productos/useInventoryFilters";
import { useProductDialogs } from "@/hooks/productos/useProductDialogs";
import { useBarcodeScanner } from "@/hooks/productos/useBarcodeScanner";
import { InventoryTab } from "@/components/productos/InventoryTab";
import { LowStockTab } from "@/components/productos/LowStockTab";
import { ImportProductsModal } from "@/components/ImportProductsModal";

export default function Productos() {
  
  const [activeTab, setActiveTab] = useState("inventario");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  
  const filters = useInventoryFilters();
  const dialogs = useProductDialogs();
  
  
  const { data: statsData } = useProductsStats();
  const statsProducts = statsData?.data || [];
  const statsPagination = statsData?.pagination;
  const lowStockProducts = statsProducts.filter((p: any) => p.stock <= (p.min_stock || 5) && p.state !== "DISABLED");

  const { data: categories = [] } = useCategories();
  
  const { data: deletedProductsData } = useDeletedProducts(activeTab === "papelera" || (statsProducts && statsProducts.length > 0)); 
  const deletedProducts = deletedProductsData?.data || [];

  const { data: inventoryData, isLoading: loadingInventory } = useInventory({
    page: filters.page,
    search: filters.search,
    lowStock: filters.lowStock,
    sortBy: filters.sortBy as any,
    state: filters.state as any,
    categoryId: filters.categoryId,
    limit: filters.limit,
  }, activeTab === "inventario");
  const inventoryProducts = inventoryData?.data || [];
  const inventoryPagination = inventoryData?.pagination;

  const { data: manualProductsData = [], isLoading: loadingManualProducts } = useManualProducts(activeTab === "manuales");
  const manualProducts = manualProductsData || [];
  const pendingManualProducts = manualProducts.filter(mp => mp.status === "PENDING");

  const { data: linkProductsData, isLoading: loadingLinkProducts } = useLinkProducts(
    dialogs.linkProductSearch,
    dialogs.linkDialogOpen
  );

  
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

  
  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) {
      dialogs.setIsDialogOpen(false);
    }
  }, [createMutation.isSuccess, updateMutation.isSuccess]);

  useEffect(() => {
    if (updateStockMutation.isSuccess) {
      dialogs.setIsStockDialogOpen(false);
    }
  }, [updateStockMutation.isSuccess]);

  useEffect(() => {
    if (linkManualMutation.isSuccess) {
        dialogs.setLinkDialogOpen(false);
        dialogs.setSelectedManualProduct(null);
        dialogs.setSelectedLinkProductId("");
        dialogs.setLinkProductSearch("");
    }
  }, [linkManualMutation.isSuccess]);

  
  const processBarcodeSearch = async (code: string) => {
    
    
    try {
        toast.loading("Buscando producto por código...", { id: "barcode-search" });
        const product = await productsApi.findByBarcode(code);
        toast.dismiss("barcode-search");

        if (product) {
            filters.setSearch(product.bar_code || product.sku || product.name);
            filters.setPage(1);
            toast.success(`Producto encontrado: ${product.name}`);
            if (activeTab !== "inventario") setActiveTab("inventario");
        } else {
            toast.error(`No se encontró producto con código: ${code}`);
            filters.setSearch("");
        }
    } catch (error) {
        toast.dismiss("barcode-search");
        toast.error("Error al buscar el producto");
        filters.setSearch("");
    }
  };

  useBarcodeScanner(processBarcodeSearch);

  
  const handleToggleState = (product: any) => {
    const newState = product.state === "DISABLED" ? "ACTIVE" : "DISABLED";
    updateMutation.mutate({
      id: product.id,
      data: { state: newState },
    });
  };

  const handleDeleteProduct = (product: any) => {
    if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleCreateCategoryInline = (name: string) => {
    createCategoryMutation.mutate(name, {
      onSuccess: (newCategory) => {
        dialogs.setSelectedCategoryId(newCategory.id);
        dialogs.setIsCreatingNewCategory(false);
        dialogs.setNewCategoryInline("");
      },
    });
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: any = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string || undefined,
      bar_code: formData.get("barcode") as string || undefined,
      categoryId: formData.get("category") as string || undefined,
      sale_price: formData.get("price") ? Number(formData.get("price")) : undefined,
      cost_price: formData.get("cost") ? Number(formData.get("cost")) : undefined,
      min_stock: formData.get("minStock") ? Number(formData.get("minStock")) : 5,
      description: formData.get("description") as string || undefined,
    };

    if (!dialogs.editingProduct) {
      data.stock = formData.get("stock") ? Number(formData.get("stock")) : 0;
    }
    
    if (dialogs.editingProduct) {
      updateMutation.mutate({ id: dialogs.editingProduct.id, data, image: dialogs.selectedImage || undefined });
    } else {
      createMutation.mutate({ data, image: dialogs.selectedImage || undefined });
    }
  };

  const handleStockUpdate = () => {
    if (dialogs.stockProduct && dialogs.stockQuantity >= 0) {
      updateStockMutation.mutate({
        id: dialogs.stockProduct.id,
        quantity: dialogs.stockQuantity,
        operation: dialogs.stockOperation,
      });
    }
  };

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

  return (
    <MainLayout title="Productos">
      <div className="space-y-4 sm:space-y-6">
        {}
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
                        onClick={dialogs.handleOpenNewProduct}
                        data-tour="productos-add"
                    >
                        <Plus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Nuevo</span>
                    </Button>
                </div>
            </div>
        </div>

        {}
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
            value={formatCurrency(statsProducts.reduce((acc: any, p: any) => acc + (p.sale_price || 0) * Math.max(0, p.stock), 0), true)}
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
            value={statsProducts.filter((p: any) => p.stock <= 0).length}
            icon={Package}
            iconBgColor="bg-destructive/20"
            iconColor="text-destructive"
          />
        </StatsGrid>

        {}
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

          <TabsContent value="inventario">
            <InventoryTab
                products={inventoryProducts}
                pagination={inventoryPagination}
                loading={loadingInventory}
                filters={filters}
                categories={categories}
                onOpenNewProduct={dialogs.handleOpenNewProduct}
                onAdjustStock={dialogs.handleAdjustStock}
                onEdit={dialogs.handleEditProduct}
                onToggleState={handleToggleState}
                onDelete={handleDeleteProduct}
                onScanClick={() => toast.info("Escanea el código de barras ahora")} 
                getStateBadge={getStateBadge}
            />
          </TabsContent>

          <TabsContent value="bajo-stock">
            <LowStockTab
                lowStockProducts={lowStockProducts}
                loading={false} 
                onAdjustStock={dialogs.handleAdjustStock}
            />
          </TabsContent>

          <TabsContent value="categorias">
             <CategoryManager
               categories={categories}
               products={statsProducts}
               onCreateCategory={(name: string) => createCategoryMutation.mutate(name)}
               onUpdateCategory={(id: string, name: string) => updateCategoryMutation.mutate({ id, name })}
               onDeleteCategory={(id: string) => deleteCategoryMutation.mutate(id)}
               isCreating={createCategoryMutation.isPending}
               isUpdating={updateCategoryMutation.isPending}
               isDeleting={deleteCategoryMutation.isPending}
             />
          </TabsContent>

          <TabsContent value="manuales">
             <ManualProductsTab
               products={manualProducts}
               isLoading={loadingManualProducts}
               onEdit={(mp: any) => {
                 dialogs.setSelectedManualProduct(mp);
                 dialogs.setEditManualForm({
                   name: mp.name,
                   quantity: mp.quantity,
                   price: mp.price,
                 });
                 dialogs.setEditManualDialogOpen(true);
               }}
               onLink={dialogs.handleLinkManualProduct}
               onConvert={(id: string) => convertManualMutation.mutate(id)}
               onIgnore={(id: string) => ignoreManualMutation.mutate(id)}
               convertLoading={convertManualMutation.isPending}
               ignoreLoading={ignoreManualMutation.isPending}
             />
          </TabsContent>
        </Tabs>

        {deletedProducts.length > 0 && (
          <div className="bunker-card p-4">
             <h3 className="text-lg font-semibold mb-4">Papelera ({deletedProducts.length})</h3>
             <DeletedProductsTab
               products={deletedProducts}
               onRestore={(id: string) => restoreMutation.mutate(id)}
               isLoading={restoreMutation.isPending}
             />
          </div>
        )}

        {}
        <ProductFormDialog
          open={dialogs.isDialogOpen}
          onOpenChange={dialogs.setIsDialogOpen}
          editingProduct={dialogs.editingProduct}
          categories={categories}
          selectedCategoryId={dialogs.selectedCategoryId}
          setSelectedCategoryId={dialogs.setSelectedCategoryId}
          isCreatingNewCategory={dialogs.isCreatingNewCategory}
          setIsCreatingNewCategory={dialogs.setIsCreatingNewCategory}
          newCategoryInline={dialogs.newCategoryInline}
          setNewCategoryInline={dialogs.setNewCategoryInline}
          scannedBarcode={dialogs.scannedBarcode}
          setScannedBarcode={dialogs.setScannedBarcode}
          selectedImage={dialogs.selectedImage}
          setSelectedImage={dialogs.setSelectedImage}
          imagePreview={dialogs.imagePreview}
          setImagePreview={dialogs.setImagePreview}
          onOpenScanner={() => toast.info("Escanea el código de barras ahora")}
          onCreateCategory={handleCreateCategoryInline}
          onSave={handleSaveProduct}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isCreatingCategory={createCategoryMutation.isPending}
        />

        <StockAdjustmentDialog
          open={dialogs.isStockDialogOpen}
          onOpenChange={dialogs.setIsStockDialogOpen}
          product={dialogs.stockProduct}
          stockQuantity={dialogs.stockQuantity}
          setStockQuantity={dialogs.setStockQuantity}
          stockOperation={dialogs.stockOperation}
          setStockOperation={dialogs.setStockOperation}
          onSave={handleStockUpdate}
          isLoading={updateStockMutation.isPending}
        />

        {}
        <Dialog 
          open={dialogs.linkDialogOpen} 
          onOpenChange={(open) => {
            dialogs.setLinkDialogOpen(open);
            if (!open) {
                dialogs.setLinkProductSearch("");
                dialogs.setSelectedLinkProductId("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular Producto</DialogTitle>
              <DialogDescription>
                Vincula "{dialogs.selectedManualProduct?.name}" a un producto existente en tu catálogo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Producto manual:</p>
                <p className="font-medium">{dialogs.selectedManualProduct?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Precio: {formatCurrency(dialogs.selectedManualProduct?.price || 0)} | Cantidad: {dialogs.selectedManualProduct?.quantity}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Buscar producto del catálogo</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, SKU o código..."
                    value={dialogs.linkProductSearch}
                    onChange={(e) => dialogs.setLinkProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {loadingLinkProducts ? (
                  <LoadingContainer className="py-8" />
                ) : (
                  <div className="border rounded-lg max-h-[300px] overflow-auto">
                    {linkProductsData?.data && linkProductsData.data.length > 0 ? (
                      linkProductsData.data.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => dialogs.setSelectedLinkProductId(p.id)}
                          className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b last:border-b-0 ${
                            dialogs.selectedLinkProductId === p.id ? "bg-primary/10 border-l-2 border-primary" : ""
                          }`}
                        >
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(p.sale_price || 0)} • Stock: {p.stock}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          {dialogs.linkProductSearch ? "No se encontraron productos" : "Ingresa un término de búsqueda"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => dialogs.setLinkDialogOpen(false)}
                disabled={linkManualMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                disabled={!dialogs.selectedLinkProductId || linkManualMutation.isPending}
                onClick={() => {
                   if (dialogs.selectedManualProduct) {
                       linkManualMutation.mutate({
                           manualId: dialogs.selectedManualProduct.id,
                           productId: dialogs.selectedLinkProductId
                       });
                   }
                }}
              >
                {linkManualMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vinculando...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Vincular
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <ImportProductsModal 
            open={isImportModalOpen}
            onOpenChange={setIsImportModalOpen}
        />
      </div>
    </MainLayout>
  );
}
