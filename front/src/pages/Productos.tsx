import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Product, Category, productsApi } from "@/api/services/products";
import { salesApi, ManualProduct } from "@/api/services/sales";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Link2,
  PackagePlus,
  Ban,
  HelpCircle,
  FileQuestion,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ScanLine,
  ImagePlus,
  MoreVertical,
  Power,
  PowerOff,
  CheckCircle,
  FolderPlus,
  Tag,
} from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  const [activeTab, setActiveTab] = useState("inventario");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Estados para el tab de Inventario (independientes del catálogo)
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryLowStock, setInventoryLowStock] = useState<boolean | undefined>(undefined);
  const [inventorySortBy, setInventorySortBy] = useState<"price_asc" | "price_desc" | "stock_asc" | "stock_desc" | "name_asc" | "name_desc" | undefined>(undefined);
  const [inventoryState, setInventoryState] = useState<"all" | "ACTIVE" | "OUT_OF_STOCK" | "DISABLED">("all");
  const [inventoryCategory, setInventoryCategory] = useState<string>("all");
  
  // Estados para productos manuales
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editManualDialogOpen, setEditManualDialogOpen] = useState(false);
  const [selectedManualProduct, setSelectedManualProduct] = useState<ManualProduct | null>(null);
  const [selectedLinkProductId, setSelectedLinkProductId] = useState<string>("");
  const [linkProductSearch, setLinkProductSearch] = useState("");
  const [editManualForm, setEditManualForm] = useState({
    name: "",
    quantity: 0,
    price: 0,
    status: "PENDING" as "PENDING" | "LINKED" | "CONVERTED" | "IGNORED",
  });

  // Estados para el escáner de códigos de barras
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<"form" | "search">("form");
  const [scannedBarcode, setScannedBarcode] = useState("");

  // Estado para la imagen del producto
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Estados para gestión de categorías
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryInline, setNewCategoryInline] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Query para estadísticas (todos los productos sin filtros)
  const { data: statsData } = useQuery({
    queryKey: ["productsStats"],
    queryFn: () =>
      productsApi.getProducts(
        {},
        { page: 1, limit: 10000 } // Obtener todos los productos para estadísticas
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
    queryKey: ["inventory", inventoryPage, inventorySearch, inventoryLowStock, inventorySortBy, inventoryState, inventoryCategory],
    queryFn: () => {
      const filters: any = {
        search: inventorySearch || undefined,
        lowStock: inventoryLowStock,
        state: inventoryState !== "all" ? inventoryState : undefined,
        categoryId: inventoryCategory !== "all" ? inventoryCategory : undefined,
      };
      
      // Determinar ordenamiento
      let sortBy: string | undefined;
      let sortOrder: "asc" | "desc" | undefined;
      
      if (inventorySortBy) {
        if (inventorySortBy === "price_asc") {
          sortBy = "sale_price";
          sortOrder = "asc";
        } else if (inventorySortBy === "price_desc") {
          sortBy = "sale_price";
          sortOrder = "desc";
        } else if (inventorySortBy === "stock_asc") {
          sortBy = "stock";
          sortOrder = "asc";
        } else if (inventorySortBy === "stock_desc") {
          sortBy = "stock";
          sortOrder = "desc";
        } else if (inventorySortBy === "name_asc") {
          sortBy = "name";
          sortOrder = "asc";
        } else if (inventorySortBy === "name_desc") {
          sortBy = "name";
          sortOrder = "desc";
        }
      }
      
      return productsApi.getProducts(
        filters,
        { page: inventoryPage, limit: 15, sortBy, sortOrder }
      );
    },
    enabled: activeTab === "inventario",
  });

  // Query para productos manuales (del POS)
  const { data: manualProducts = [], isLoading: loadingManualProducts } = useQuery({
    queryKey: ["manualProducts"],
    queryFn: () => salesApi.getManualProducts(),
    enabled: activeTab === "manuales",
  });

  // Query para productos disponibles para vincular (con búsqueda)
  const { data: linkProductsData, isLoading: loadingLinkProducts } = useQuery({
    queryKey: ["linkProducts", linkProductSearch],
    queryFn: () =>
      productsApi.getProducts(
        { search: linkProductSearch || undefined, state: "ACTIVE" },
        { page: 1, limit: 100 }
      ),
    enabled: linkDialogOpen,
  });

  // Filtrar productos manuales pendientes
  const pendingManualProducts = manualProducts.filter(mp => mp.status === "PENDING");

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => productsApi.createProduct(data),
    onSuccess: async (product) => {
      // Subir imagen si se seleccionó una
      if (selectedImage) {
        try {
          await productsApi.updateProductImage(product.id, selectedImage);
        } catch {
          toast.error("El producto se creó pero hubo un error al subir la imagen");
        }
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productsStats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Producto creado exitosamente");
      setIsDialogOpen(false);
      setEditingProduct(null);
      setSelectedImage(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al crear producto");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productsApi.updateProduct(id, data),
    onSuccess: async (product) => {
      // Subir imagen si se seleccionó una nueva
      if (selectedImage) {
        try {
          await productsApi.updateProductImage(product.id, selectedImage);
        } catch {
          toast.error("El producto se actualizó pero hubo un error al subir la imagen");
        }
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productsStats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
      toast.success("Producto actualizado");
      setIsDialogOpen(false);
      setEditingProduct(null);
      setSelectedImage(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al actualizar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productsStats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
      queryClient.invalidateQueries({ queryKey: ["productsStats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
      queryClient.invalidateQueries({ queryKey: ["productsStats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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

  // Mutations para productos manuales
  const linkManualMutation = useMutation({
    mutationFn: ({ manualId, productId }: { manualId: string; productId: string }) =>
      salesApi.linkManualProduct(manualId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualProducts"] });
      toast.success("Producto vinculado exitosamente");
      setLinkDialogOpen(false);
      setSelectedManualProduct(null);
      setSelectedLinkProductId("");
      setLinkProductSearch("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al vincular producto");
    },
  });

  const convertManualMutation = useMutation({
    mutationFn: (id: string) => salesApi.convertManualProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto convertido y agregado al catálogo");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al convertir producto");
    },
  });

  const ignoreManualMutation = useMutation({
    mutationFn: (id: string) => salesApi.ignoreManualProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualProducts"] });
      toast.success("Producto ignorado");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al ignorar producto");
    },
  });

  const updateManualMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => salesApi.updateManualProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualProducts"] });
      toast.success("Producto manual actualizado");
      setEditManualDialogOpen(false);
      setSelectedManualProduct(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al actualizar producto");
    },
  });

  // Mutations para categorías
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => productsApi.createCategory(name),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría creada exitosamente");
      setIsCategoryDialogOpen(false);
      setNewCategoryName("");
      setEditingCategory(null);
      // Si se creó desde el formulario inline, seleccionar la categoría
      if (isCreatingNewCategory) {
        setSelectedCategoryId(category.id);
        setIsCreatingNewCategory(false);
        setNewCategoryInline("");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al crear categoría");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => productsApi.updateCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría actualizada");
      setIsCategoryDialogOpen(false);
      setNewCategoryName("");
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al actualizar categoría");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría eliminada");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al eliminar categoría");
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

  // Datos para estadísticas
  const statsProducts = statsData?.data || [];
  const statsPagination = statsData?.pagination;
  
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
              {statsPagination?.total || 0} productos en inventario
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
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setScannedBarcode("");
                setSelectedImage(null);
                setImagePreview(null);
                setSelectedCategoryId("");
                setIsCreatingNewCategory(false);
                setNewCategoryInline("");
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingProduct(null);
                  setScannedBarcode("");
                  setSelectedImage(null);
                  setImagePreview(null);
                  setSelectedCategoryId("");
                  setIsCreatingNewCategory(false);
                  setNewCategoryInline("");
                }}>
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
                    {/* Imagen del producto */}
                    <div className="col-span-2">
                      <Label>Imagen del producto</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center overflow-hidden">
                          {imagePreview || editingProduct?.imageUrl ? (
                            <img
                              src={imagePreview || editingProduct?.imageUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="product-image"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error("La imagen no puede superar 5MB");
                                  return;
                                }
                                setSelectedImage(file);
                                setImagePreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("product-image")?.click()}
                          >
                            <ImagePlus className="w-4 h-4 mr-2" />
                            {imagePreview || editingProduct?.imageUrl ? "Cambiar imagen" : "Subir imagen"}
                          </Button>
                          {(imagePreview || selectedImage) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-2 text-destructive"
                              onClick={() => {
                                setSelectedImage(null);
                                setImagePreview(null);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG o WebP (máx. 5MB)
                          </p>
                        </div>
                      </div>
                    </div>

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
                      <div className="flex gap-2">
                        <Input
                          id="barcode"
                          name="barcode"
                          value={scannedBarcode}
                          onChange={(e) => setScannedBarcode(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setScannerMode("form");
                            setScannerOpen(true);
                          }}
                          title="Escanear código de barras"
                        >
                          <ScanLine className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category">Categoría</Label>
                      {isCreatingNewCategory ? (
                        <div className="flex gap-2">
                          <Input
                            value={newCategoryInline}
                            onChange={(e) => setNewCategoryInline(e.target.value)}
                            placeholder="Nombre de la nueva categoría"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (newCategoryInline.trim()) {
                                createCategoryMutation.mutate(newCategoryInline.trim());
                              }
                            }}
                            disabled={!newCategoryInline.trim() || createCategoryMutation.isPending}
                          >
                            {createCategoryMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsCreatingNewCategory(false);
                              setNewCategoryInline("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Select 
                          value={selectedCategoryId || editingProduct?.categoryId || ""}
                          onValueChange={(value) => {
                            if (value === "__new__") {
                              setIsCreatingNewCategory(true);
                            } else {
                              setSelectedCategoryId(value);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__new__" className="text-primary">
                              <div className="flex items-center gap-2">
                                <FolderPlus className="w-4 h-4" />
                                <span>+ Crear nueva categoría</span>
                              </div>
                            </SelectItem>
                            {categories.length > 0 && (
                              <div className="border-t my-1" />
                            )}
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <input 
                        type="hidden" 
                        name="category" 
                        value={selectedCategoryId || editingProduct?.categoryId || ""} 
                      />
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
                <p className="text-2xl font-bold text-foreground">{statsPagination?.total || 0}</p>
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
                  {statsProducts.filter((p) => p.state === "ACTIVE" && p.stock > 0).length}
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
                  {statsProducts.filter((p) => p.stock <= 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-secondary/50">
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
            <TabsTrigger value="manuales">
              Manuales
              {pendingManualProducts.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-500/20 text-blue-400">
                  {pendingManualProducts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="categorias">
              Categorías ({categories.length})
            </TabsTrigger>
          </TabsList>

          {/* Inventario Tab */}
          <TabsContent value="inventario" className="space-y-4">
            {/* Buscador y Filtros de Inventario */}
            <div className="space-y-4">
              {/* Búsqueda principal */}
              <div className="flex gap-2">
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setScannerMode("search");
                    setScannerOpen(true);
                  }}
                  title="Escanear código de barras"
                >
                  <ScanLine className="w-4 h-4 mr-2" />
                  Escanear
                </Button>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
                </div>

                {/* Filtro Stock Bajo */}
                <Button
                  variant={inventoryLowStock === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setInventoryLowStock(inventoryLowStock === true ? undefined : true);
                    setInventoryPage(1);
                  }}
                >
                  <AlertTriangle className={`w-4 h-4 mr-1 ${inventoryLowStock === true ? "" : "text-warning"}`} />
                  Stock Bajo
                </Button>

                {/* Filtro Estado */}
                <Select
                  value={inventoryState}
                  onValueChange={(value: any) => {
                    setInventoryState(value);
                    setInventoryPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="ACTIVE">Activos</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Sin Stock</SelectItem>
                    <SelectItem value="DISABLED">Deshabilitados</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro Categoría */}
                <Select
                  value={inventoryCategory}
                  onValueChange={(value) => {
                    setInventoryCategory(value);
                    setInventoryPage(1);
                  }}
                >
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

                {/* Ordenar por */}
                <Select
                  value={inventorySortBy || "none"}
                  onValueChange={(value: any) => {
                    setInventorySortBy(value === "none" ? undefined : value);
                    setInventoryPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin ordenar</SelectItem>
                    <SelectItem value="price_desc">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="w-4 h-4" />
                        Precio: Mayor a Menor
                      </div>
                    </SelectItem>
                    <SelectItem value="price_asc">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="w-4 h-4" />
                        Precio: Menor a Mayor
                      </div>
                    </SelectItem>
                    <SelectItem value="stock_desc">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="w-4 h-4" />
                        Stock: Mayor a Menor
                      </div>
                    </SelectItem>
                    <SelectItem value="stock_asc">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="w-4 h-4" />
                        Stock: Menor a Mayor
                      </div>
                    </SelectItem>
                    <SelectItem value="name_asc">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="w-4 h-4" />
                        Nombre: A-Z
                      </div>
                    </SelectItem>
                    <SelectItem value="name_desc">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="w-4 h-4" />
                        Nombre: Z-A
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Botón limpiar filtros */}
                {(inventorySearch || inventoryLowStock !== undefined || inventoryState !== "all" || inventoryCategory !== "all" || inventorySortBy) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInventorySearch("");
                      setInventoryLowStock(undefined);
                      setInventoryState("all");
                      setInventoryCategory("all");
                      setInventorySortBy(undefined);
                      setInventoryPage(1);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpiar Filtros
                  </Button>
                )}
              </div>
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
                      <TableHead className="text-muted-foreground text-right">Precio</TableHead>
                      <TableHead className="text-muted-foreground text-center">Stock Actual</TableHead>
                      <TableHead className="text-muted-foreground text-center">Stock Mínimo</TableHead>
                      <TableHead className="text-muted-foreground text-center">Reservado</TableHead>
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                      <TableHead className="text-muted-foreground text-center">Acciones</TableHead>
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
                        <TableCell className="text-right">
                          <span className="font-semibold text-foreground">
                            {product.sale_price ? `$${product.sale_price.toLocaleString()}` : "-"}
                          </span>
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
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setStockProduct(product);
                                setIsStockDialogOpen(true);
                              }}
                              title="Ajustar stock"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setScannedBarcode(product.bar_code || "");
                                    setSelectedCategoryId(product.categoryId || "");
                                    setIsCreatingNewCategory(false);
                                    setNewCategoryInline("");
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {product.state === "DISABLED" ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      updateMutation.mutate({
                                        id: product.id,
                                        data: { state: "ACTIVE" },
                                      });
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2 text-success" />
                                    Activar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      updateMutation.mutate({
                                        id: product.id,
                                        data: { state: "DISABLED" },
                                      });
                                    }}
                                  >
                                    <Ban className="w-4 h-4 mr-2 text-warning" />
                                    Deshabilitar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
                                      deleteMutation.mutate(product.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

          {/* Tab Productos Manuales */}
          <TabsContent value="manuales" className="space-y-4">
            <div className="bunker-card p-4 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">¿Qué son los productos manuales?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Son productos agregados manualmente en el Punto de Venta que no existían en el catálogo. 
                    Puedes vincularlos a productos existentes, convertirlos en nuevos productos, o ignorarlos.
                  </p>
                </div>
              </div>
            </div>

            {loadingManualProducts ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : manualProducts.length === 0 ? (
              <div className="bunker-card p-12 text-center">
                <FileQuestion className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-foreground">Sin productos manuales</p>
                <p className="text-muted-foreground">
                  Los productos agregados manualmente en el POS aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="bunker-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Producto</TableHead>
                      <TableHead className="text-muted-foreground text-right">Precio</TableHead>
                      <TableHead className="text-muted-foreground text-center">Cantidad</TableHead>
                      <TableHead className="text-muted-foreground">Fecha</TableHead>
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                      <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualProducts.map((mp) => (
                      <TableRow key={mp.id} className="border-border">
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{mp.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{mp.originalText}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          ${mp.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {mp.quantity}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(mp.createdAt), "dd MMM, HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {mp.status === "PENDING" && (
                            <Badge variant="outline" className="border-blue-500 text-blue-400">
                              Pendiente
                            </Badge>
                          )}
                          {mp.status === "LINKED" && (
                            <Badge variant="outline" className="border-success text-success">
                              Vinculado
                            </Badge>
                          )}
                          {mp.status === "CONVERTED" && (
                            <Badge variant="outline" className="border-primary text-primary">
                              Convertido
                            </Badge>
                          )}
                          {mp.status === "IGNORED" && (
                            <Badge variant="secondary">Ignorado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {mp.status === "PENDING" && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedManualProduct(mp);
                                  setEditManualForm({
                                    name: mp.name,
                                    quantity: mp.quantity,
                                    price: mp.price,
                                    status: mp.status,
                                  });
                                  setEditManualDialogOpen(true);
                                }}
                                title="Editar producto"
                              >
                                <Edit2 className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedManualProduct(mp);
                                  setLinkDialogOpen(true);
                                }}
                                title="Vincular a producto existente"
                              >
                                <Link2 className="w-4 h-4 mr-1" />
                                Vincular
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => convertManualMutation.mutate(mp.id)}
                                disabled={convertManualMutation.isPending}
                                title="Crear nuevo producto"
                              >
                                <PackagePlus className="w-4 h-4 mr-1" />
                                Convertir
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => ignoreManualMutation.mutate(mp.id)}
                                disabled={ignoreManualMutation.isPending}
                                className="text-muted-foreground hover:text-destructive"
                                title="Ignorar"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {mp.status !== "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedManualProduct(mp);
                                setEditManualForm({
                                  name: mp.name,
                                  quantity: mp.quantity,
                                  price: mp.price,
                                  status: mp.status,
                                });
                                setEditManualDialogOpen(true);
                              }}
                              title="Editar producto manual"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Tab Categorías */}
          <TabsContent value="categorias" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Gestión de Categorías</h3>
                <p className="text-sm text-muted-foreground">
                  Organiza tus productos creando y gestionando categorías
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategoryName("");
                  setIsCategoryDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
            </div>

            {categories.length === 0 ? (
              <div className="bunker-card p-12 text-center">
                <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-foreground">No hay categorías</p>
                <p className="text-muted-foreground mb-4">
                  Crea categorías para organizar mejor tus productos
                </p>
                <Button
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategoryName("");
                    setIsCategoryDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primera categoría
                </Button>
              </div>
            ) : (
              <div className="bunker-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Nombre</TableHead>
                      <TableHead className="text-muted-foreground text-center">Productos</TableHead>
                      <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => {
                      // Contar productos de esta categoría
                      const productCount = statsData?.data.filter(
                        (p) => p.categoryId === category.id
                      ).length || 0;
                      
                      return (
                        <TableRow key={category.id} className="border-border">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Tag className="w-5 h-5 text-primary" />
                              </div>
                              <span className="font-medium text-foreground">{category.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{productCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setNewCategoryName(category.name);
                                  setIsCategoryDialogOpen(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (productCount > 0) {
                                    toast.error(
                                      `No se puede eliminar "${category.name}" porque tiene ${productCount} producto(s) asociado(s)`
                                    );
                                    return;
                                  }
                                  if (confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
                                    deleteCategoryMutation.mutate(category.id);
                                  }
                                }}
                                disabled={productCount > 0}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog para crear/editar categoría */}
        <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
          setIsCategoryDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
            setNewCategoryName("");
          }
        }}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? "Modifica el nombre de la categoría"
                  : "Crea una nueva categoría para organizar tus productos"
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Nombre de la categoría</Label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Bebidas, Lácteos, Limpieza..."
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!newCategoryName.trim()) {
                    toast.error("El nombre de la categoría es requerido");
                    return;
                  }
                  if (editingCategory) {
                    updateCategoryMutation.mutate({
                      id: editingCategory.id,
                      name: newCategoryName.trim(),
                    });
                  } else {
                    createCategoryMutation.mutate(newCategoryName.trim());
                  }
                }}
                disabled={
                  !newCategoryName.trim() ||
                  createCategoryMutation.isPending ||
                  updateCategoryMutation.isPending
                }
              >
                {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para vincular producto manual */}
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
                <Label>Seleccionar producto del catálogo</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto por nombre, SKU o código de barras..."
                    value={linkProductSearch}
                    onChange={(e) => setLinkProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {loadingLinkProducts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="border rounded-lg max-h-[300px] overflow-auto">
                    {linkProductsData?.data && linkProductsData.data.length > 0 ? (
                      <div className="divide-y">
                        {linkProductsData.data.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedLinkProductId(p.id)}
                            className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors ${
                              selectedLinkProductId === p.id ? "bg-primary/10 border-l-2 border-primary" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{p.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  {p.sku && (
                                    <span className="text-xs text-muted-foreground font-mono">SKU: {p.sku}</span>
                                  )}
                                  {p.bar_code && (
                                    <span className="text-xs text-muted-foreground font-mono">Código: {p.bar_code}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-semibold text-foreground">
                                  ${p.sale_price?.toLocaleString() || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
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
                {selectedLinkProductId && (
                  <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-xs text-muted-foreground">Producto seleccionado:</p>
                    <p className="font-medium text-sm">
                      {linkProductsData?.data.find((p) => p.id === selectedLinkProductId)?.name}
                    </p>
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
                Vincular
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar producto manual */}
        <Dialog
          open={editManualDialogOpen}
          onOpenChange={(open) => {
            setEditManualDialogOpen(open);
            if (!open) {
              setSelectedManualProduct(null);
              setEditManualForm({ name: "", quantity: 0, price: 0, status: "PENDING" });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Producto Manual</DialogTitle>
              <DialogDescription>
                Modifica los datos del producto manual "{selectedManualProduct?.name}"
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedManualProduct) {
                  updateManualMutation.mutate({
                    id: selectedManualProduct.id,
                    data: editManualForm,
                  });
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input
                  id="edit-name"
                  value={editManualForm.name}
                  onChange={(e) => setEditManualForm({ ...editManualForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-quantity">Cantidad *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="1"
                    value={editManualForm.quantity}
                    onChange={(e) =>
                      setEditManualForm({ ...editManualForm, quantity: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Precio *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editManualForm.price}
                    onChange={(e) =>
                      setEditManualForm({ ...editManualForm, price: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-status">Estado</Label>
                <Select
                  value={editManualForm.status}
                  onValueChange={(value: any) =>
                    setEditManualForm({ ...editManualForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="LINKED">Vinculado</SelectItem>
                    <SelectItem value="CONVERTED">Convertido</SelectItem>
                    <SelectItem value="IGNORED">Ignorado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditManualDialogOpen(false);
                    setSelectedManualProduct(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateManualMutation.isPending}>
                  {updateManualMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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

        {/* Escáner de códigos de barras */}
        <BarcodeScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          title={scannerMode === "form" ? "Escanear Código de Barras" : "Buscar Producto por Código"}
          onScan={async (code) => {
            if (scannerMode === "form") {
              // Modo formulario: establecer el código en el input
              setScannedBarcode(code);
              toast.success(`Código escaneado: ${code}`);
            } else {
              // Modo búsqueda: buscar producto y filtrar
              try {
                const product = await productsApi.findByBarcode(code);
                if (product) {
                  setInventorySearch(code);
                  setInventoryPage(1);
                  toast.success(`Producto encontrado: ${product.name}`);
                } else {
                  toast.error("No se encontró ningún producto con ese código de barras");
                }
              } catch {
                toast.error("No se encontró ningún producto con ese código de barras");
              }
            }
          }}
        />
      </div>
    </MainLayout>
  );
}
