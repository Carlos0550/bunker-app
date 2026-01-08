import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { mockProducts, mockStockMovements } from "@/data/mockData";
import { StockMovement } from "@/types";
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
  TrendingDown
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export default function Stock() {
  const [movements, setMovements] = useState<StockMovement[]>(mockStockMovements);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const lowStockProducts = mockProducts.filter((p) => p.stock <= p.minStock);

  const handleNewMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = formData.get("productId") as string;
    const product = mockProducts.find((p) => p.id === productId);
    
    const movement: StockMovement = {
      id: `MOV-${Date.now()}`,
      productId,
      productName: product?.name || "",
      type: formData.get("type") as "in" | "out" | "adjustment",
      quantity: Number(formData.get("quantity")),
      reason: formData.get("reason") as string,
      reference: formData.get("reference") as string,
      createdAt: new Date(),
    };

    setMovements((prev) => [movement, ...prev]);
    setIsDialogOpen(false);
    toast.success("Movimiento registrado");
  };

  const filteredMovements = movements.filter(
    (m) =>
      m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const movementTypeConfig = {
    in: { icon: ArrowDownCircle, label: "Entrada", color: "text-success", bg: "bg-success/20" },
    out: { icon: ArrowUpCircle, label: "Salida", color: "text-destructive", bg: "bg-destructive/20" },
    adjustment: { icon: RefreshCw, label: "Ajuste", color: "text-warning", bg: "bg-warning/20" },
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
                    <SelectContent>
                      {mockProducts.map((p) => (
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
                  <Button type="submit">Registrar</Button>
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
                <p className="text-2xl font-bold text-foreground">24</p>
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
                <p className="text-2xl font-bold text-foreground">18</p>
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
        <Tabs defaultValue="movements" className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="movements">Movimientos</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="movements" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar movimientos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>

            <div className="bunker-card overflow-hidden">
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
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div className="bunker-card overflow-hidden">
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
                  {mockProducts.map((product) => (
                    <TableRow key={product.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-foreground">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {product.sku}
                      </TableCell>
                      <TableCell className="text-center font-bold text-foreground">
                        {product.stock}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {product.minStock}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.stock <= product.minStock ? "destructive" : "outline"}
                          className={product.stock > product.minStock ? "border-success text-success" : ""}
                        >
                          {product.stock <= product.minStock ? "Bajo" : "Normal"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

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
                        Mínimo requerido: {product.minStock}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Crear orden de compra
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
