import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Product, Category, productsApi } from "@/api/services/products";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportProductsModal } from "@/components/ImportProductsModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Package,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Productos() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockOperation, setStockOperation] = useState<"add" | "subtract" | "set">("add");
  const [stockQuantity, setStockQuantity] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("catalogo");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Estados para el tab de Inventario (independientes del catálogo)
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);

  // Queries
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products", currentPage, searchTerm, selectedCategory],
    queryFn: () =>
      productsApi.getProducts(
        {
          search: searchTerm || undefined,
          categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
        },
        { page: currentPage, limit: 20 }
      ),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productsApi.getCategories(),
  });

  const { data: lowStockProducts = [], isLoading: loadingLowStock } = useQuery({
    queryKey: ["lowStockProducts"],
    queryFn: () => productsApi.getLowStockProducts(),
  });

  const { data: deletedProductsData } = useQuery({
    queryKey: ["deletedProducts"],
    queryFn: () => productsApi.getDeletedProducts({ page: 1, limit: 50 }),
  });

  // Query separada para el tab de Inventario
  const { data: inventoryData, isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory", inventoryPage, inventorySearch],
    queryFn: () =>
      productsApi.getProducts(
        { search: inventorySearch || undefined },
        { page: inventoryPage, limit: 15 }
      ),
    enabled: activeTab === "inventario",
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto creado exitosamente");
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al crear producto");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productsApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
      toast.success("Producto actualizado");
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al actualizar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["deletedProducts"] });
      toast.success("Producto movido a papelera");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al eliminar");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => productsApi.restoreProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["deletedProducts"] });
      toast.success("Producto restaurado");
    },
  });

  const updateStockMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
      toast.success("Stock actualizado");
      setIsStockDialogOpen(false);
      setStockProduct(null);
      setStockQuantity(0);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al actualizar stock");
    },
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
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
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
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

  const products = productsData?.data || [];
  const pagination = productsData?.pagination;
  const deletedProducts = deletedProductsData?.data || [];
  
  // Datos del inventario
  const inventoryProducts = inventoryData?.data || [];
  const inventoryPagination = inventoryData?.pagination;

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Productos</h1>
            <p className="text-muted-foreground">
              {pagination?.total || 0} productos en inventario
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingProduct(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editingProduct?.name}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        name="sku"
                        defaultValue={editingProduct?.sku || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="barcode">Código de Barras</Label>
                      <Input
                        id="barcode"
                        name="barcode"
                        defaultValue={editingProduct?.bar_code || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoría</Label>
                      <Select name="category" defaultValue={editingProduct?.categoryId || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="price">Precio de Venta</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        defaultValue={editingProduct?.sale_price || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Costo</Label>
                      <Input
                        id="cost"
                        name="cost"
                        type="number"
                        step="0.01"
                        defaultValue={editingProduct?.cost_price || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock Inicial</Label>
                      <Input
                        id="stock"
                        name="stock"
                        type="number"
                        defaultValue={editingProduct?.stock || 0}
                        disabled={!!editingProduct}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minStock">Stock Mínimo</Label>
                      <Input
                        id="minStock"
                        name="minStock"
                        type="number"
                        defaultValue={editingProduct?.min_stock || 5}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={editingProduct?.description || ""}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editingProduct ? "Guardar Cambios" : "Crear Producto"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-bold text-foreground">{pagination?.total || 0}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/20">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-foreground">
                  {products.filter((p) => p.state === "ACTIVE" && p.stock > 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="stat-card border-warning/30">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-warning/20">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold text-warning">{lowStockProducts.length}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-destructive/20">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sin Stock</p>
                <p className="text-2xl font-bold text-destructive">
                  {products.filter((p) => p.stock <= 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
            <TabsTrigger value="alertas">
              Alertas
              {lowStockProducts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {lowStockProducts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="papelera">Papelera ({deletedProducts.length})</TabsTrigger>
          </TabsList>

          {/* Catálogo Tab */}
          <TabsContent value="catalogo" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-card"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Products Table */}
            <div className="bunker-card overflow-hidden">
              {loadingProducts ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Producto</TableHead>
                      <TableHead className="text-muted-foreground">SKU</TableHead>
                      <TableHead className="text-muted-foreground">Categoría</TableHead>
                      <TableHead className="text-muted-foreground text-right">Precio</TableHead>
                      <TableHead className="text-muted-foreground text-right">Costo</TableHead>
                      <TableHead className="text-muted-foreground text-center">Stock</TableHead>
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                      <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium text-foreground">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {product.sku || "-"}
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="secondary">{product.category.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {product.sale_price
                            ? `$${product.sale_price.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {product.cost_price
                            ? `$${product.cost_price.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={product.stock <= (product.min_stock || 5) ? "destructive" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              setStockProduct(product);
                              setIsStockDialogOpen(true);
                            }}
                          >
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStateBadge(product.state, product.stock, product.min_stock || 5)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingProduct(product);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Página {currentPage} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Inventario Tab */}
          <TabsContent value="inventario" className="space-y-4">
            {/* Buscador de Inventario */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, SKU o código de barras..."
                  value={inventorySearch}
                  onChange={(e) => {
                    setInventorySearch(e.target.value);
                    setInventoryPage(1);
                  }}
                  className="pl-9 bg-card"
                />
              </div>
              {inventorySearch && (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setInventorySearch("");
                    setInventoryPage(1);
                  }}
                >
                  Limpiar
                </Button>
              )}
            </div>

            <div className="bunker-card overflow-hidden">
              {loadingInventory ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : inventoryProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium text-foreground">No hay productos</p>
                  <p className="text-muted-foreground">
                    {inventorySearch 
                      ? "No se encontraron productos con ese criterio" 
                      : "Agrega productos para verlos aquí"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Producto</TableHead>
                      <TableHead className="text-muted-foreground">SKU</TableHead>
                      <TableHead className="text-muted-foreground text-center">Stock Actual</TableHead>
                      <TableHead className="text-muted-foreground text-center">Stock Mínimo</TableHead>
                      <TableHead className="text-muted-foreground text-center">Reservado</TableHead>
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                      <TableHead className="text-muted-foreground text-center">Ajustar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryProducts.map((product) => (
                      <TableRow key={product.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">{product.name}</span>
                              {product.bar_code && (
                                <p className="text-xs text-muted-foreground font-mono">{product.bar_code}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {product.sku || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${product.stock <= 0 ? "text-destructive" : product.stock <= (product.min_stock || 5) ? "text-warning" : "text-foreground"}`}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {product.min_stock ?? 5}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {product.reserved_stock || 0}
                        </TableCell>
                        <TableCell>
                          {getStateBadge(product.state, product.stock, product.min_stock || 5)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setStockProduct(product);
                              setIsStockDialogOpen(true);
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Ajustar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Paginación del Inventario */}
            {inventoryPagination && inventoryPagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((inventoryPage - 1) * 15) + 1} - {Math.min(inventoryPage * 15, inventoryPagination.total)} de {inventoryPagination.total} productos
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inventoryPage === 1}
                    onClick={() => setInventoryPage(1)}
                  >
                    Primera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inventoryPage === 1}
                    onClick={() => setInventoryPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Página {inventoryPage} de {inventoryPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inventoryPage === inventoryPagination.totalPages}
                    onClick={() => setInventoryPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inventoryPage === inventoryPagination.totalPages}
                    onClick={() => setInventoryPage(inventoryPagination.totalPages)}
                  >
                    Última
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Alertas Tab */}
          <TabsContent value="alertas" className="space-y-4">
            {loadingLowStock ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="bunker-card p-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-foreground">Todo en orden</p>
                <p className="text-muted-foreground">No hay productos con stock bajo</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bunker-card p-4 border-warning/30 flex items-center gap-4"
                  >
                    <div className="p-3 rounded-xl bg-warning/20">
                      <AlertTriangle className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Stock actual: <span className="text-warning font-bold">{product.stock}</span> | 
                        Mínimo requerido: {product.threshold} |
                        Déficit: <span className="text-destructive font-bold">{product.deficit}</span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStockProduct(product);
                        setStockOperation("add");
                        setStockQuantity(product.deficit);
                        setIsStockDialogOpen(true);
                      }}
                    >
                      <ArrowDownCircle className="w-4 h-4 mr-1" />
                      Reponer Stock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Papelera Tab */}
          <TabsContent value="papelera" className="space-y-4">
            {deletedProducts.length === 0 ? (
              <div className="bunker-card p-12 text-center">
                <Trash2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-foreground">Papelera vacía</p>
                <p className="text-muted-foreground">No hay productos eliminados</p>
              </div>
            ) : (
              <div className="bunker-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Producto</TableHead>
                      <TableHead className="text-muted-foreground">SKU</TableHead>
                      <TableHead className="text-muted-foreground">Eliminado</TableHead>
                      <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedProducts.map((product) => (
                      <TableRow key={product.id} className="border-border">
                        <TableCell className="font-medium text-foreground">
                          {product.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {product.sku || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.deletedAt
                            ? new Date(product.deletedAt).toLocaleDateString("es-ES")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreMutation.mutate(product.id)}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Restaurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Stock Dialog */}
        <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajustar Stock - {stockProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Stock actual: <span className="font-bold text-foreground">{stockProduct?.stock}</span>
                </p>
              </div>
              <div>
                <Label>Operación</Label>
                <Select
                  value={stockOperation}
                  onValueChange={(v) => setStockOperation(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <div className="flex items-center">
                        <ArrowDownCircle className="w-4 h-4 mr-2 text-success" />
                        Entrada (Agregar)
                      </div>
                    </SelectItem>
                    <SelectItem value="subtract">
                      <div className="flex items-center">
                        <ArrowUpCircle className="w-4 h-4 mr-2 text-destructive" />
                        Salida (Restar)
                      </div>
                    </SelectItem>
                    <SelectItem value="set">
                      <div className="flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2 text-warning" />
                        Ajuste (Establecer)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min={0}
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                />
              </div>
              {stockOperation !== "set" && stockProduct && (
                <p className="text-sm text-muted-foreground">
                  Nuevo stock:{" "}
                  <span className="font-bold">
                    {stockOperation === "add"
                      ? stockProduct.stock + stockQuantity
                      : stockProduct.stock - stockQuantity}
                  </span>
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleStockUpdate}
                disabled={updateStockMutation.isPending}
              >
                {updateStockMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Importación */}
        <ImportProductsModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
        />
      </div>
    </MainLayout>
  );
}
