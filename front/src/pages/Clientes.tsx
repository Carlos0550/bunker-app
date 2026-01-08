import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { mockCustomers, mockSales } from "@/data/mockData";
import { Customer } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Clientes() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleDelete = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    toast.success("Cliente eliminado");
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCustomer: Customer = {
      id: editingCustomer?.id || crypto.randomUUID(),
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      totalPurchases: editingCustomer?.totalPurchases || 0,
      balance: editingCustomer?.balance || 0,
      createdAt: editingCustomer?.createdAt || new Date(),
    };

    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? newCustomer : c))
      );
      toast.success("Cliente actualizado");
    } else {
      setCustomers((prev) => [...prev, newCustomer]);
      toast.success("Cliente creado");
    }

    setIsDialogOpen(false);
    setEditingCustomer(null);
  };

  const customerSales = selectedCustomer
    ? mockSales.filter((s) => s.customerId === selectedCustomer.id)
    : [];

  return (
    <MainLayout title="Clientes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Clientes</h1>
            <p className="text-muted-foreground">
              {customers.length} clientes registrados
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCustomer(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingCustomer?.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingCustomer?.email}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={editingCustomer?.phone}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Dirección (opcional)</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={editingCustomer?.address}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCustomer ? "Guardar Cambios" : "Crear Cliente"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bunker-card p-5 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cliente desde {format(customer.createdAt, "MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(customer)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
                {customer.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {customer.totalPurchases} compras
                  </span>
                </div>
                {customer.balance > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Saldo: ${customer.balance.toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Customer Detail Dialog */}
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl">
            {selectedCustomer && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {selectedCustomer.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="stat-card">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Compras</p>
                        <p className="text-xl font-bold">{selectedCustomer.totalPurchases}</p>
                      </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                        <p className="text-xl font-bold">
                          ${selectedCustomer.balance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Últimas Compras</h4>
                  {customerSales.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Sin compras registradas</p>
                  ) : (
                    <div className="space-y-2">
                      {customerSales.map((sale) => (
                        <div
                          key={sale.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                        >
                          <div>
                            <p className="font-medium text-foreground">{sale.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(sale.createdAt, "dd MMM yyyy, HH:mm", { locale: es })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">${sale.total.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {sale.items.length} productos
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
