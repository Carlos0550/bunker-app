import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { productsApi } from "@/api/services/products";
import { analyticsApi } from "@/api/services/analytics";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCw,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason: string;
  reference?: string;
  createdAt: Date;
}

export default function Stock() {
  const queryClient = useQueryClient();
  
  // Estados para búsqueda y paginación de inventario
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryLimit] = useState(10);
  
  // Estados para búsqueda de movimientos (local por ahora)
  const [movementSearch, setMovementSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Movimientos locales (temporal hasta que haya API)
  const [localMovements, setLocalMovements] = useState<StockMovement[]>([]);

  // Query para productos del inventario con paginación
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["stockProducts", inventorySearch, inventoryPage, inventoryLimit],
    queryFn: () =>
      productsApi.getProducts(
        { search: inventorySearch || undefined },
        { page: inventoryPage, limit: inventoryLimit }
      ),
    staleTime: 30000,
  });

  // Query para productos con stock bajo
  const { data: lowStockData } = useQuery({
    queryKey: ["lowStockProducts"],
    queryFn: () => analyticsApi.getLowStockProducts(),
    staleTime: 60000,
  });

  // Query para estadísticas del dashboard (para obtener conteos)
  const { data: statsData } = useQuery({
    queryKey: ["stockStats"],
    queryFn: () => analyticsApi.getDashboardStats(),
    staleTime: 60000,
  });

  // Query para todos los productos (para el selector del formulario)
  const { data: allProductsData } = useQuery({
    queryKey: ["allProductsForSelect"],
    queryFn: () => productsApi.getProducts({ state: "ACTIVE" }, { page: 1, limit: 500 }),
    staleTime: 60000,
  });

  const products = productsData?.data || [];
  const pagination = productsData?.pagination;
  const lowStockProducts = lowStockData || [];
  const allProducts = allProductsData?.data || [];

  // Calcular estadísticas de movimientos locales
  const todayMovements = localMovements.filter(m => {
    const today = new Date();
    const movementDate = new Date(m.createdAt);
    return movementDate.toDateString() === today.toDateString();
  });
  
  const todayInCount = todayMovements.filter(m => m.type === "in").reduce((sum, m) => sum + m.quantity, 0);
  const todayOutCount = todayMovements.filter(m => m.type === "out").reduce((sum, m) => sum + m.quantity, 0);

  // Mutation para actualizar stock
  const updateStockMutation = useMutation({
    mutationFn: async (data: { productId: string; quantity: number; type: "in" | "out" | "adjustment" }) => {
      // Calcular el nuevo stock
      const product = allProducts.find(p => p.id === data.productId);
      if (!product) throw new Error("Producto no encontrado");
      
      let newStock = product.stock;
      if (data.type === "in") {
        newStock = product.stock + data.quantity;
      } else if (data.type === "out") {
        newStock = product.stock - data.quantity;
        if (newStock < 0) throw new Error("Stock insuficiente");
      } else {
        newStock = data.quantity; // Ajuste directo
      }
      
      return productsApi.updateProduct(data.productId, { stock: newStock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockProducts"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
      queryClient.invalidateQueries({ queryKey: ["allProductsForSelect"] });
    },
  });

  const handleNewMovement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = formData.get("productId") as string;
    const product = allProducts.find((p) => p.id === productId);
    const type = formData.get("type") as "in" | "out" | "adjustment";
    const quantity = Number(formData.get("quantity"));
    
    if (!product) {
      toast.error("Producto no encontrado");
      return;
    }

    try {
      // Actualizar stock en la base de datos
      await updateStockMutation.mutateAsync({ productId, quantity, type });
      
      // Registrar movimiento local
      const movement: StockMovement = {
        id: `MOV-${Date.now()}`,
        productId,
        productName: product?.name || "",
        type,
        quantity,
        reason: formData.get("reason") as string,
        reference: formData.get("reference") as string,
        createdAt: new Date(),
      };

      setLocalMovements((prev) => [movement, ...prev]);
      setIsDialogOpen(false);
      toast.success("Movimiento registrado y stock actualizado");
    } catch (error: any) {
      toast.error(error.message || "Error al registrar movimiento");
    }
  };

  const filteredMovements = localMovements.filter(
    (m) =>
      m.productName.toLowerCase().includes(movementSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(movementSearch.toLowerCase())
  );

  const movementTypeConfig = {
    in: { icon: ArrowDownCircle, label: "Entrada", color: "text-success", bg: "bg-success/20" },
    out: { icon: ArrowUpCircle, label: "Salida", color: "text-destructive", bg: "bg-destructive/20" },
    adjustment: { icon: RefreshCw, label: "Ajuste", color: "text-warning", bg: "bg-warning/20" },
  };

  // Paginación
  const totalPages = pagination?.totalPages || 1;
  const currentPage = pagination?.page || 1;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setInventoryPage(page);
    }
  };

  // Generar números de página
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <MainLayout title="Control de Stock">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Control de Stock</h1>
            <p className="text-muted-foreground">
              Gestiona entradas, salidas y ajustes de inventario
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Movimiento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Movimiento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleNewMovement} className="space-y-4">
                <div>
                  <Label htmlFor="productId">Producto</Label>
                  <Select name="productId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {allProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Entrada</SelectItem>
                        <SelectItem value="out">Salida</SelectItem>
                        <SelectItem value="adjustment">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason">Motivo</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    placeholder="Descripción del movimiento..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reference">Referencia (opcional)</Label>
                  <Input
                    id="reference"
                    name="reference"
                    placeholder="Ej: OC-2024-001, VTA-001"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateStockMutation.isPending}>
                    {updateStockMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Registrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/20">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entradas Hoy</p>
                <p className="text-2xl font-bold text-foreground">{todayInCount}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-destructive/20">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Salidas Hoy</p>
                <p className="text-2xl font-bold text-foreground">{todayOutCount}</p>
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
        </div>

        {/* Tabs */}
        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="movements">Movimientos</TabsTrigger>
            <TabsTrigger value="alerts">
              Alertas
              {lowStockProducts.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {lowStockProducts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab Inventario */}
          <TabsContent value="inventory" className="space-y-4">
            {/* Buscador */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos por nombre, SKU o código de barras..."
                  value={inventorySearch}
                  onChange={(e) => {
                    setInventorySearch(e.target.value);
                    setInventoryPage(1); // Reset a página 1 al buscar
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

            {/* Tabla de inventario */}
            <div className="bunker-card overflow-hidden">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium text-foreground">No hay productos</p>
                  <p className="text-muted-foreground">
                    {inventorySearch 
                      ? "No se encontraron productos con ese criterio de búsqueda" 
                      : "Agrega productos desde la sección de Productos"}
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
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const isLowStock = product.min_stock !== null && product.stock <= product.min_stock;
                      return (
                        <TableRow key={product.id} className="border-border">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
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
                            <span className={`font-bold ${isLowStock ? "text-warning" : "text-foreground"}`}>
                              {product.stock}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {product.min_stock ?? "-"}
                          </TableCell>
                          <TableCell>
                            {product.stock === 0 ? (
                              <Badge variant="destructive">Sin Stock</Badge>
                            ) : isLowStock ? (
                              <Badge className="bg-warning/20 text-warning border-0">Stock Bajo</Badge>
                            ) : (
                              <Badge variant="outline" className="border-success text-success">
                                Normal
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * inventoryLimit) + 1} - {Math.min(currentPage * inventoryLimit, pagination.total)} de {pagination.total} productos
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  {getPageNumbers().map((page, idx) => (
                    typeof page === "number" ? (
                      <Button
                        key={idx}
                        variant={page === currentPage ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    ) : (
                      <span key={idx} className="px-2 text-muted-foreground">...</span>
                    )
                  ))}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab Movimientos */}
          <TabsContent value="movements" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar movimientos..."
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>

            <div className="bunker-card overflow-hidden">
              {filteredMovements.length === 0 ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium text-foreground">Sin movimientos</p>
                  <p className="text-muted-foreground">
                    Los movimientos de stock aparecerán aquí
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">ID</TableHead>
                      <TableHead className="text-muted-foreground">Producto</TableHead>
                      <TableHead className="text-muted-foreground">Tipo</TableHead>
                      <TableHead className="text-muted-foreground text-center">Cantidad</TableHead>
                      <TableHead className="text-muted-foreground">Motivo</TableHead>
                      <TableHead className="text-muted-foreground">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.map((movement) => {
                      const config = movementTypeConfig[movement.type];
                      const Icon = config.icon;
                      return (
                        <TableRow key={movement.id} className="border-border">
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {movement.id}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {movement.productName}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${config.bg} ${config.color} border-0`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            <span className={movement.type === "out" ? "text-destructive" : "text-success"}>
                              {movement.type === "out" ? "-" : "+"}{movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {movement.reason}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(movement.createdAt, "dd MMM, HH:mm", { locale: es })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Tab Alertas */}
          <TabsContent value="alerts" className="space-y-4">
            {lowStockProducts.length === 0 ? (
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
                        Mínimo requerido: {product.min_stock}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Stock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
