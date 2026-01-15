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
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3" onClick={() => setIsImportModalOpen(true)} data-tour="productos-import">
                <Upload className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Importar</span>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Exportar</span>
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
                <Button size="sm" className="h-8 sm:h-9" onClick={() => {
                  setEditingProduct(null);
                  setScannedBarcode("");
                  setSelectedImage(null);
                  setImagePreview(null);
                  setSelectedCategoryId("");
                  setIsCreatingNewCategory(false);
                  setNewCategoryInline("");
                }} data-tour="productos-add">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nuevo Producto</span>
                  <span className="sm:hidden">Nuevo</span>
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Productos</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{statsPagination?.total || 0}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-primary/20 shrink-0">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Activos</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {statsProducts.filter((p) => p.state === "ACTIVE" && p.stock > 0).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-success/20 shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
              </div>
            </div>
          </div>
          <div className="stat-card border-warning/30">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Stock Bajo</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">{lowStockProducts.length}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-warning/20 shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Sin Stock</p>
                <p className="text-xl sm:text-2xl font-bold text-destructive">
                  {statsProducts.filter((p) => p.stock <= 0).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-destructive/20 shrink-0">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide" data-tour="productos-tabs">
            <TabsList className="bg-secondary/50 inline-flex w-max sm:w-auto min-w-full sm:min-w-0">
              <TabsTrigger value="inventario" className="text-sm sm:text-base px-3 sm:px-4 shrink-0">
                <span className="hidden sm:inline">Inventario</span>
                <span className="sm:hidden">Inv.</span>
              </TabsTrigger>
              <TabsTrigger value="alertas" className="text-sm sm:text-base px-3 sm:px-4 shrink-0">
                <span className="hidden sm:inline">Alertas</span>
                <span className="sm:hidden">Alert.</span>
                {lowStockProducts.length > 0 && (
                  <Badge variant="destructive" className="ml-1.5 sm:ml-2 text-xs sm:text-sm px-1.5 sm:px-2">
                    {lowStockProducts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="papelera" className="text-sm sm:text-base px-3 sm:px-4 shrink-0">
                <span className="hidden sm:inline">Papelera</span>
                <span className="sm:hidden">Pap.</span>
                <span className="ml-1.5 text-xs sm:text-sm">({deletedProducts.length})</span>
              </TabsTrigger>
              <TabsTrigger value="manuales" className="text-sm sm:text-base px-3 sm:px-4 shrink-0">
                <span className="hidden sm:inline">Manuales</span>
                <span className="sm:hidden">Man.</span>
                {pendingManualProducts.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 sm:ml-2 bg-blue-500/20 text-blue-400 text-xs sm:text-sm px-1.5 sm:px-2">
                    {pendingManualProducts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="categorias" className="text-sm sm:text-base px-3 sm:px-4 shrink-0">
                <span className="hidden sm:inline">Categorías</span>
                <span className="sm:hidden">Cat.</span>
                <span className="ml-1.5 text-xs sm:text-sm hidden sm:inline">({categories.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Inventario Tab */}
          <TabsContent value="inventario" className="space-y-3 sm:space-y-4">
            {/* Buscador y Filtros de Inventario */}
            <div className="space-y-3">
              {/* Búsqueda principal */}
              <div className="flex gap-2" data-tour="productos-search">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, SKU o código de barras..."
                    value={inventorySearch}
                    onChange={(e) => {
                      setInventorySearch(e.target.value);
                      setInventoryPage(1);
                    }}
                    className="pl-9 bg-card text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-9 w-9 sm:h-10 sm:w-auto sm:px-4"
                  onClick={() => {
                    setScannerMode("search");
                    setScannerOpen(true);
                  }}
                  title="Escanear código de barras"
                >
                  <ScanLine className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Escanear</span>
                </Button>
              </div>

              {/* Filtros - scroll horizontal en móvil */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
                <div className="flex-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
                  <div className="flex gap-1.5 sm:gap-2 items-center w-max min-w-full sm:min-w-0">
                    {/* Filtro Stock Bajo */}
                    <Button
                      variant={inventoryLowStock === true ? "default" : "outline"}
                      size="sm"
                      className="h-8 sm:h-7 text-xs shrink-0 whitespace-nowrap"
                      onClick={() => {
                        setInventoryLowStock(inventoryLowStock === true ? undefined : true);
                        setInventoryPage(1);
                      }}
                    >
                      <AlertTriangle className={`w-3 h-3 sm:mr-1 ${inventoryLowStock === true ? "" : "text-warning"}`} />
                      <span className="hidden sm:inline">Bajo</span>
                    </Button>

                    {/* Filtro Estado */}
                    <Select
                      value={inventoryState}
                      onValueChange={(value: any) => {
                        setInventoryState(value);
                        setInventoryPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 sm:h-7 text-xs w-[100px] sm:w-[110px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
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
                      <SelectTrigger className="h-8 sm:h-7 text-xs w-[110px] sm:w-[120px] shrink-0">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Categorías</SelectItem>
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
                      <SelectTrigger className="h-8 sm:h-7 text-xs w-[90px] sm:w-[100px] shrink-0">
                        <SelectValue placeholder="Ordenar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin orden</SelectItem>
                        <SelectItem value="price_desc">Precio ↓</SelectItem>
                        <SelectItem value="price_asc">Precio ↑</SelectItem>
                        <SelectItem value="stock_desc">Stock ↓</SelectItem>
                        <SelectItem value="stock_asc">Stock ↑</SelectItem>
                        <SelectItem value="name_asc">A-Z</SelectItem>
                        <SelectItem value="name_desc">Z-A</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Botón limpiar filtros */}
                    {(inventoryLowStock !== undefined || inventoryState !== "all" || inventoryCategory !== "all" || inventorySortBy) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 sm:h-7 text-xs px-2 sm:px-2 shrink-0"
                        onClick={() => {
                          setInventoryLowStock(undefined);
                          setInventoryState("all");
                          setInventoryCategory("all");
                          setInventorySortBy(undefined);
                          setInventoryPage(1);
                        }}
                        title="Limpiar filtros"
                      >
                        <X className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline ml-1">Limpiar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bunker-card overflow-hidden p-0" data-tour="productos-table">
              {loadingInventory ? (
                <div className="flex items-center justify-center p-8 sm:p-12">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
                </div>
              ) : inventoryProducts.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                  <p className="text-base sm:text-lg font-medium text-foreground">No hay productos</p>
                  <p className="text-sm text-muted-foreground">
                    {inventorySearch 
                      ? "No se encontraron productos con ese criterio" 
                      : "Agrega productos para verlos aquí"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Vista móvil: Cards */}
                  <div className="block md:hidden p-3 sm:p-4 space-y-3">
                    {inventoryProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bunker-card p-3 border border-border/50 hover:border-border transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
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
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
                                {product.name}
                              </h3>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setStockProduct(product);
                                      setIsStockDialogOpen(true);
                                    }}
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Ajustar Stock
                                  </DropdownMenuItem>
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
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex-1 min-w-[120px]">
                                <div className="text-xs text-muted-foreground mb-0.5">Precio</div>
                                <div className="font-semibold text-sm text-foreground">
                                  {product.sale_price ? `$${product.sale_price.toLocaleString()}` : "-"}
                                </div>
                              </div>
                              <div className="flex-1 min-w-[80px]">
                                <div className="text-xs text-muted-foreground mb-0.5">Stock</div>
                                <div className={`font-bold text-sm ${product.stock <= 0 ? "text-destructive" : product.stock <= (product.min_stock || 5) ? "text-warning" : "text-foreground"}`}>
                                  {product.stock}
                                </div>
                              </div>
                              <div className="flex-1 min-w-[80px]">
                                <div className="text-xs text-muted-foreground mb-0.5">Mín</div>
                                <div className="text-sm text-muted-foreground">
                                  {product.min_stock ?? 5}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-border/50">
                              {getStateBadge(product.state, product.stock, product.min_stock || 5)}
                              {product.sku && (
                                <span className="ml-2 text-xs text-muted-foreground font-mono">
                                  SKU: {product.sku}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vista desktop: Tabla */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground text-xs sm:text-sm pl-3 sm:pl-4">Producto</TableHead>
                          <TableHead className="text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">SKU</TableHead>
                          <TableHead className="text-muted-foreground text-xs sm:text-sm text-right">Precio</TableHead>
                          <TableHead className="text-muted-foreground text-xs sm:text-sm text-center">Stock</TableHead>
                          <TableHead className="text-muted-foreground text-xs sm:text-sm text-center hidden md:table-cell">Mín</TableHead>
                          <TableHead className="text-muted-foreground text-xs sm:text-sm text-center hidden lg:table-cell">Res.</TableHead>
                          <TableHead className="text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">Estado</TableHead>
                          <TableHead className="text-muted-foreground text-xs sm:text-sm text-center pr-3 sm:pr-4"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryProducts.map((product) => (
                          <TableRow key={product.id} className="border-border">
                            <TableCell className="pl-3 sm:pl-4 py-2 sm:py-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium text-foreground text-xs sm:text-sm line-clamp-1 sm:line-clamp-2">{product.name}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">
                              {product.sku || "-"}
                            </TableCell>
                            <TableCell className="text-right py-2 sm:py-4">
                              <span className="font-semibold text-foreground text-xs sm:text-sm whitespace-nowrap">
                                {product.sale_price ? `$${product.sale_price.toLocaleString()}` : "-"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-2 sm:py-4">
                              <span className={`font-bold text-sm ${product.stock <= 0 ? "text-destructive" : product.stock <= (product.min_stock || 5) ? "text-warning" : "text-foreground"}`}>
                                {product.stock}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                              {product.min_stock ?? 5}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                              {product.reserved_stock || 0}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                              {getStateBadge(product.state, product.stock, product.min_stock || 5)}
                            </TableCell>
                            <TableCell className="text-center pr-3 sm:pr-4 py-2 sm:py-4">
                              <div className="flex items-center justify-center gap-1" data-tour="productos-actions">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setStockProduct(product);
                                    setIsStockDialogOpen(true);
                                  }}
                                  title="Ajustar stock"
                                  className="h-8"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                  </div>
                </>
              )}
            </div>

            {/* Paginación del Inventario */}
            {inventoryPagination && inventoryPagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  Mostrando {((inventoryPage - 1) * 15) + 1} - {Math.min(inventoryPage * 15, inventoryPagination.total)} de {inventoryPagination.total} productos
                </p>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inventoryPage === 1}
                    onClick={() => setInventoryPage(1)}
                    className="hidden sm:flex"
                  >
                    Primera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inventoryPage === 1}
                    onClick={() => setInventoryPage((p) => p - 1)}
                  >
                    <span className="sm:hidden">←</span>
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                  <span className="flex items-center px-2 sm:px-4 text-sm text-muted-foreground whitespace-nowrap">
                    {inventoryPage} / {inventoryPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inventoryPage === inventoryPagination.totalPages}
                    onClick={() => setInventoryPage((p) => p + 1)}
                  >
                    <span className="sm:hidden">→</span>
                    <span className="hidden sm:inline">Siguiente</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inventoryPage === inventoryPagination.totalPages}
                    onClick={() => setInventoryPage(inventoryPagination.totalPages)}
                    className="hidden sm:flex"
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
              <div className="grid gap-3 sm:gap-4">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bunker-card p-3 sm:p-4 border-warning/30 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full max-w-full"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-1">
                      <div className="p-2 sm:p-3 rounded-xl bg-warning/20 shrink-0">
                        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <h3 className="font-medium text-foreground truncate text-sm sm:text-base">{product.name}</h3>
                        <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 mt-1">
                          <span>Stock: <span className="text-warning font-bold">{product.stock}</span></span>
                          <span className="hidden sm:inline">|</span>
                          <span>Mínimo: {product.threshold}</span>
                          <span className="hidden sm:inline">|</span>
                          <span>Déficit: <span className="text-destructive font-bold">{product.deficit}</span></span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto shrink-0 whitespace-nowrap"
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Producto</TableHead>
                        <TableHead className="text-muted-foreground hidden sm:table-cell">SKU</TableHead>
                        <TableHead className="text-muted-foreground hidden sm:table-cell">Eliminado</TableHead>
                        <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedProducts.map((product) => (
                        <TableRow key={product.id} className="border-border">
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{product.name}</p>
                              {/* Info adicional en móvil */}
                              <div className="sm:hidden text-xs text-muted-foreground mt-1">
                                {product.sku && <span className="font-mono">{product.sku} • </span>}
                                {product.deletedAt && new Date(product.deletedAt).toLocaleDateString("es-ES")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground hidden sm:table-cell">
                            {product.sku || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell">
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
                              <RotateCcw className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Restaurar</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground min-w-[150px]">Producto</TableHead>
                        <TableHead className="text-muted-foreground text-right">Precio</TableHead>
                        <TableHead className="text-muted-foreground text-center hidden sm:table-cell">Cantidad</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">Fecha</TableHead>
                        <TableHead className="text-muted-foreground hidden sm:table-cell">Estado</TableHead>
                        <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualProducts.map((mp) => (
                        <TableRow key={mp.id} className="border-border">
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{mp.name}</p>
                              <p className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">{mp.originalText}</p>
                              {/* Mostrar info adicional en móvil */}
                              <div className="sm:hidden mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>x{mp.quantity}</span>
                                <span>•</span>
                                {mp.status === "PENDING" && (
                                  <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs py-0">
                                    Pendiente
                                  </Badge>
                                )}
                                {mp.status === "LINKED" && (
                                  <Badge variant="outline" className="border-success text-success text-xs py-0">
                                    Vinculado
                                  </Badge>
                                )}
                                {mp.status === "CONVERTED" && (
                                  <Badge variant="outline" className="border-primary text-primary text-xs py-0">
                                    Convertido
                                  </Badge>
                                )}
                                {mp.status === "IGNORED" && (
                                  <Badge variant="secondary" className="text-xs py-0">Ignorado</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-foreground whitespace-nowrap">
                            ${mp.price.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground hidden sm:table-cell">
                            {mp.quantity}
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell whitespace-nowrap">
                            {format(new Date(mp.createdAt), "dd MMM, HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
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
                              <>
                                {/* Vista desktop */}
                                <div className="hidden lg:flex items-center justify-end gap-1">
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
                                {/* Vista móvil/tablet - dropdown */}
                                <div className="lg:hidden">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
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
                                      >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedManualProduct(mp);
                                          setLinkDialogOpen(true);
                                        }}
                                      >
                                        <Link2 className="w-4 h-4 mr-2" />
                                        Vincular
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => convertManualMutation.mutate(mp.id)}
                                        disabled={convertManualMutation.isPending}
                                      >
                                        <PackagePlus className="w-4 h-4 mr-2" />
                                        Convertir
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => ignoreManualMutation.mutate(mp.id)}
                                        disabled={ignoreManualMutation.isPending}
                                        className="text-muted-foreground"
                                      >
                                        <Ban className="w-4 h-4 mr-2" />
                                        Ignorar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </>
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
                                <Edit2 className="w-4 h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Editar</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab Categorías */}
          <TabsContent value="categorias" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium">Gestión de Categorías</h3>
                <p className="text-sm text-muted-foreground">
                  Organiza tus productos creando y gestionando categorías
                </p>
              </div>
              <Button
                className="w-full sm:w-auto"
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
                <div className="overflow-x-auto">
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
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                </div>
                                <span className="font-medium text-foreground">{category.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{productCount}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 sm:gap-2">
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
