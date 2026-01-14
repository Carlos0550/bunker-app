import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { customersApi, BusinessCustomer, CurrentAccount, CustomerMetrics, SaleItem, SaleWithItems } from "@/api/services/customers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Search, 
  Plus, 
  Users,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Phone,
  Mail,
  Loader2,
  Banknote,
  Building2,
  CheckCircle,
  Clock,
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit3,
  TrendingUp,
  FileText,
  Receipt,
  Trash,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

const MONTH_NAMES: Record<string, string> = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
};

export default function Clientes() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaleItemsDialogOpen, setIsSaleItemsDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [editingAccountNotes, setEditingAccountNotes] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<BusinessCustomer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<BusinessCustomer | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<CurrentAccount | null>(null);
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const [isLoadingSaleItems, setIsLoadingSaleItems] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [accountNotes, setAccountNotes] = useState("");
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  
  // Item editing states
  const [itemProductName, setItemProductName] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnitPrice, setItemUnitPrice] = useState(0);

  // Queries
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers", searchTerm],
    queryFn: () =>
      customersApi.getCustomers({
        search: searchTerm || undefined,
        page: 1,
        limit: 100,
      }),
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["accountsSummary"],
    queryFn: () => customersApi.getAccountsSummary(),
  });

  const { data: customerMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ["customerMetrics", selectedCustomer?.id],
    queryFn: () =>
      selectedCustomer ? customersApi.getCustomerMetrics(selectedCustomer.id) : null,
    enabled: !!selectedCustomer,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => customersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["accountsSummary"] });
      toast.success("Cliente creado exitosamente");
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al crear cliente");
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      customersApi.updateCustomer(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customerMetrics"] });
      toast.success("Notas actualizadas");
      setIsEditingNotes(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al actualizar notas");
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({
      accountId,
      amount,
      paymentMethod,
      notes,
    }: {
      accountId: string;
      amount: number;
      paymentMethod: "CASH" | "CARD" | "TRANSFER" | "OTHER";
      notes?: string;
    }) => customersApi.registerPayment(accountId, { amount, paymentMethod, notes }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["accountsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["customerMetrics"] });
      toast.success(result.message);
      setIsPaymentOpen(false);
      setSelectedAccount(null);
      setPaymentAmount(0);
      setPaymentNotes("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al registrar pago");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["accountsSummary"] });
      toast.success("Cliente eliminado exitosamente");
      setSelectedCustomer(null);
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al eliminar cliente");
    },
  });

  // Sale items mutations
  const addItemMutation = useMutation({
    mutationFn: ({ saleId, data }: { saleId: string; data: any }) => 
      customersApi.addSaleItem(saleId, data),
    onSuccess: async () => {
      // Recargar los items de la venta actual
      if (selectedSale) {
        const updatedSale = await customersApi.getSaleItems(selectedSale.id);
        setSelectedSale(updatedSale);
      }
      // Invalidar queries para actualizar la vista principal
      queryClient.invalidateQueries({ queryKey: ["saleItems"] });
      queryClient.invalidateQueries({ queryKey: ["customerMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Item agregado exitosamente");
      setIsEditItemDialogOpen(false);
      resetItemForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al agregar item");
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) => 
      customersApi.updateSaleItem(itemId, data),
    onSuccess: async () => {
      // Recargar los items de la venta actual
      if (selectedSale) {
        const updatedSale = await customersApi.getSaleItems(selectedSale.id);
        setSelectedSale(updatedSale);
      }
      // Invalidar queries para actualizar la vista principal
      queryClient.invalidateQueries({ queryKey: ["saleItems"] });
      queryClient.invalidateQueries({ queryKey: ["customerMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Item actualizado exitosamente");
      setIsEditItemDialogOpen(false);
      resetItemForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al actualizar item");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => customersApi.deleteSaleItem(itemId),
    onSuccess: async () => {
      // Recargar los items de la venta actual
      if (selectedSale) {
        const updatedSale = await customersApi.getSaleItems(selectedSale.id);
        setSelectedSale(updatedSale);
      }
      // Invalidar queries para actualizar la vista principal
      queryClient.invalidateQueries({ queryKey: ["saleItems"] });
      queryClient.invalidateQueries({ queryKey: ["customerMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Item eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al eliminar item");
    },
  });

  const updateAccountNotesMutation = useMutation({
    mutationFn: ({ accountId, notes }: { accountId: string; notes: string }) =>
      customersApi.updateAccountNotes(accountId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerMetrics"] });
      toast.success("Notas actualizadas exitosamente");
      setEditingAccountNotes(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al actualizar notas");
    },
  });

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      identifier: formData.get("identifier") as string,
      name: formData.get("name") as string,
      phone: formData.get("phone") as string || undefined,
      email: formData.get("email") as string || undefined,
      address: formData.get("address") as string || undefined,
      creditLimit: formData.get("creditLimit") ? Number(formData.get("creditLimit")) : undefined,
      notes: formData.get("notes") as string || undefined,
    };

    createMutation.mutate(data);
  };

  const handleRegisterPayment = () => {
    if (!selectedAccount || paymentAmount <= 0) return;

    paymentMutation.mutate({
      accountId: selectedAccount.id,
      amount: paymentAmount,
      paymentMethod,
      notes: paymentNotes || undefined,
    });
  };

  const handleSaveNotes = () => {
    if (!selectedCustomer) return;
    updateNotesMutation.mutate({
      id: selectedCustomer.id,
      notes: customerNotes,
    });
  };

  const handleOpenDeleteDialog = (customer: BusinessCustomer, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;
    deleteMutation.mutate(customerToDelete.id);
  };

  const handleViewSaleItems = async (saleId: string) => {
    try {
      setIsLoadingSaleItems(true);
      const sale = await customersApi.getSaleItems(saleId);
      setSelectedSale(sale);
      setIsSaleItemsDialogOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Error al cargar items");
    } finally {
      setIsLoadingSaleItems(false);
    }
  };

  const handleOpenEditItem = (item?: SaleItem) => {
    if (item) {
      setSelectedItem(item);
      setItemProductName(item.productName);
      setItemQuantity(item.quantity);
      setItemUnitPrice(item.unitPrice);
    } else {
      setSelectedItem(null);
      resetItemForm();
    }
    setIsEditItemDialogOpen(true);
  };

  const resetItemForm = () => {
    setSelectedItem(null);
    setItemProductName("");
    setItemQuantity(1);
    setItemUnitPrice(0);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    const data = {
      productName: itemProductName,
      quantity: itemQuantity,
      unitPrice: itemUnitPrice,
      isManual: true,
    };

    if (selectedItem) {
      updateItemMutation.mutate({ itemId: selectedItem.id, data });
      setIsSaleItemsDialogOpen(false);
      setIsLoadingSaleItems(false);
    } else {
      addItemMutation.mutate({ saleId: selectedSale.id, data });
      setIsSaleItemsDialogOpen(false);
      setIsLoadingSaleItems(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm("¿Estás seguro de eliminar este item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const handleEditAccountNotes = (account: CurrentAccount) => {
    setEditingAccountNotes(account.id);
    setAccountNotes(account.notes || "");
  };

  const handleSaveAccountNotes = (accountId: string) => {
    updateAccountNotesMutation.mutate({ accountId, notes: accountNotes });
  };

  const handleCancelAccountNotes = () => {
    setEditingAccountNotes(null);
    setAccountNotes("");
  };

  const toggleAccountExpanded = (accountId: string) => {
    setExpandedAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const customers = customersData?.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="destructive">Pendiente</Badge>;
      case "PARTIAL":
        return <Badge variant="outline" className="border-warning text-warning">Parcial</Badge>;
      case "PAID":
        return <Badge variant="outline" className="border-success text-success">Pagado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return "Efectivo";
      case "CARD":
        return "Tarjeta";
      case "TRANSFER":
        return "Transferencia";
      default:
        return method;
    }
  };

  const formatMonthKey = (key: string) => {
    const [year, month] = key.split("-");
    return `${MONTH_NAMES[month]} ${year}`;
  };

  const getDaysInfo = (account: CurrentAccount) => {
    const createdAt = new Date(account.createdAt);

    if (account.status === "PAID" && account.paidAt) {
      const paidAt = new Date(account.paidAt);
      const diffMs = paidAt.getTime() - createdAt.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffHours / 24);
      
      let text: string;
      if (diffHours < 24) {
        text = diffHours === 0 
          ? "Pagado hace menos de 1 hora"
          : `Pagado en ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;
      } else {
        text = `Pagado en ${days} día${days !== 1 ? "s" : ""}`;
      }
      
      return {
        text,
        color: days <= 7 ? "text-success" : days <= 30 ? "text-warning" : "text-muted-foreground",
      };
    }

    const diffMs = new Date().getTime() - createdAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffHours / 24);
    
    let text: string;
    if (diffHours < 24) {
      text = diffHours === 0 
        ? "Hace menos de 1 hora"
        : `Hace ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;
    } else {
      text = `Hace ${days} día${days !== 1 ? "s" : ""}`;
    }
    
    return {
      text,
      color: days > 30 ? "text-destructive" : days > 7 ? "text-warning" : "text-muted-foreground",
    };
  };

  return (
    <MainLayout title="Clientes">
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Clientes</h1>
            <p className="text-muted-foreground">
              {customers.length} clientes registrados
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveCustomer} className="space-y-4">
                <div>
                  <Label htmlFor="identifier">Identificador (Cédula/RUC/Teléfono) *</Label>
                  <Input id="identifier" name="identifier" required />
                </div>
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" type="tel" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" name="address" />
                </div>
                <div>
                  <Label htmlFor="creditLimit">Límite de Crédito</Label>
                  <Input id="creditLimit" name="creditLimit" type="number" min={0} />
                </div>
                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" name="notes" rows={2} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Crear Cliente
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {!loadingSummary && summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="stat-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                  <p className="text-lg font-bold text-foreground">{customers.length}</p>
                </div>
              </div>
            </div>
            <div className="stat-card p-3 border-destructive/30">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deuda Total</p>
                  <p className="text-lg font-bold text-destructive">
                    ${summary.totalDebt.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="stat-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-warning/20">
                  <CreditCard className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cuentas Activas</p>
                  <p className="text-lg font-bold text-foreground">
                    {summary.pendingAccounts + summary.partialAccounts}
                  </p>
                </div>
              </div>
            </div>
            <div className="stat-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-success/20">
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagadas</p>
                  <p className="text-lg font-bold text-success">{summary.paidAccounts}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Master-Detail Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Left Panel - Customer List */}
          <div className="lg:col-span-1 bunker-card flex flex-col min-h-0">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-secondary/50"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {loadingCustomers ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <Users className="w-10 h-10 mb-3 opacity-50" />
                  <p className="text-sm">No hay clientes</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {customers.map((bc) => (
                    <button
                      key={bc.id}
                      onClick={() => {
                        setSelectedCustomer(bc);
                        setCustomerNotes(bc.notes || "");
                        setIsEditingNotes(false);
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedCustomer?.id === bc.id
                          ? "bg-primary/20 border border-primary/30"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          (bc.totalDebt || 0) > 0 ? "bg-destructive/20" : "bg-primary/20"
                        }`}>
                          <Users className={`w-5 h-5 ${
                            (bc.totalDebt || 0) > 0 ? "text-destructive" : "text-primary"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground truncate">
                              {bc.customer.name}
                            </p>
                            <div className="flex items-center gap-1">
                              {(bc.totalDebt || 0) > 0 && (
                                <span className="text-sm font-bold text-destructive whitespace-nowrap">
                                  ${bc.totalDebt?.toLocaleString()}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => handleOpenDeleteDialog(bc, e)}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            {bc.customer.identifier}
                          </p>
                          {(bc.activeAccounts || 0) > 0 && (
                            <Badge variant="outline" className="mt-1 text-xs border-warning text-warning">
                              {bc.activeAccounts} cuenta{bc.activeAccounts !== 1 ? "s" : ""} activa{bc.activeAccounts !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Customer Detail */}
          <div className="lg:col-span-2 bunker-card flex flex-col min-h-0 overflow-hidden">
            {!selectedCustomer ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <Users className="w-16 h-16 mb-4 opacity-30" />
                <p>Selecciona un cliente para ver su información</p>
              </div>
            ) : loadingMetrics ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : customerMetrics ? (
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Customer Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                        {customerMetrics.customer.name}
                      </h2>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                        <span className="font-mono truncate">{customerMetrics.customer.identifier}</span>
                        {customerMetrics.customer.phone && (
                          <span className="flex items-center gap-1 truncate">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="truncate">{customerMetrics.customer.phone}</span>
                          </span>
                        )}
                        {customerMetrics.customer.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{customerMetrics.customer.email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 shrink-0 w-full sm:w-auto"
                      onClick={() => handleOpenDeleteDialog(selectedCustomer!)}
                    >
                      <Trash className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Eliminar Cliente</span>
                      <span className="sm:hidden">Eliminar</span>
                    </Button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-destructive/10 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">Deuda Actual</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-destructive truncate">
                        ${customerMetrics.totalDebt.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-success/10 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">Total Pagado</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-success truncate">
                        ${customerMetrics.totalPaid.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">Prom. Pago</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-primary truncate">
                        {customerMetrics.averagePaymentDays !== null
                          ? `${customerMetrics.averagePaymentDays} días`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Receipt className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">Cuentas</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold truncate">
                        {customerMetrics.totalAccountsCount}
                      </p>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Notas del Cliente</span>
                      </div>
                      {!isEditingNotes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingNotes(true)}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                    {isEditingNotes ? (
                      <div className="space-y-2">
                        <Textarea
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          placeholder="Agregar notas sobre este cliente..."
                          rows={3}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCustomerNotes(customerMetrics.notes || "");
                              setIsEditingNotes(false);
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveNotes}
                            disabled={updateNotesMutation.isPending}
                          >
                            {updateNotesMutation.isPending && (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            )}
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {customerMetrics.notes || "Sin notas"}
                      </p>
                    )}
                  </div>

                  {/* Accounts History by Month */}
                  {customerMetrics.accountsByMonth.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-medium">Historial de Cuentas</h3>
                      </div>

                      {customerMetrics.accountsByMonth.map(({ monthKey, accounts }) => (
                        <div key={monthKey} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {formatMonthKey(monthKey)}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                          </div>

                          {accounts.map((account) => {
                            const daysInfo = getDaysInfo(account);
                            const isExpanded = expandedAccounts.has(account.id);

                            return (
                              <Collapsible
                                key={account.id}
                                open={isExpanded}
                                onOpenChange={() => toggleAccountExpanded(account.id)}
                              >
                                <div className="rounded-lg bg-secondary/30 overflow-hidden">
                                  <div className="p-3 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                        <span className="font-mono text-xs sm:text-sm font-medium truncate">
                                          {account.sale?.saleNumber || "Sin número"}
                                        </span>
                                        <div className="shrink-0">
                                          {getStatusBadge(account.status)}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {account.sale && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleViewSaleItems(account.saleId);
                                            }}
                                            disabled={isLoadingSaleItems}
                                            className="text-xs sm:text-sm"
                                          >
                                            <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Ver Items</span>
                                            <span className="sm:hidden">Items</span>
                                            {isLoadingSaleItems && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-1 animate-spin" />}
                                          </Button>
                                        )}
                                        {account.status !== "PAID" && (
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedAccount(account);
                                              setPaymentAmount(account.currentBalance);
                                              setIsPaymentOpen(true);
                                            }}
                                            className="text-xs sm:text-sm"
                                          >
                                            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                            Abonar
                                          </Button>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <span className="text-muted-foreground">
                                          Original: <span className="font-medium text-foreground">${account.originalAmount.toLocaleString()}</span>
                                        </span>
                                        <span className={account.currentBalance > 0 ? "text-destructive" : "text-success"}>
                                          Pendiente: <span className="font-bold">${account.currentBalance.toLocaleString()}</span>
                                        </span>
                                      </div>
                                      <span className={`text-xs ${daysInfo.color} whitespace-nowrap`}>
                                        {daysInfo.text}
                                      </span>
                                    </div>

                                    {/* Notas de la cuenta */}
                                    <div className="mt-2">
                                      {editingAccountNotes === account.id ? (
                                        <div className="space-y-2">
                                          <Textarea
                                            value={accountNotes}
                                            onChange={(e) => setAccountNotes(e.target.value)}
                                            placeholder="Agregar notas sobre esta deuda..."
                                            rows={2}
                                            className="text-sm"
                                          />
                                          <div className="flex items-center gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={handleCancelAccountNotes}
                                            >
                                              Cancelar
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={() => handleSaveAccountNotes(account.id)}
                                              disabled={updateAccountNotesMutation.isPending}
                                            >
                                              {updateAccountNotesMutation.isPending && (
                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                              )}
                                              Guardar
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            {account.notes ? (
                                              <p className="text-xs text-muted-foreground italic bg-secondary/30 p-2 rounded">
                                                📝 {account.notes}
                                              </p>
                                            ) : (
                                              <p className="text-xs text-muted-foreground">
                                                Sin notas
                                              </p>
                                            )}
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEditAccountNotes(account)}
                                            className="h-6 px-2"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>

                                    {account.payments.length > 0 && (
                                      <CollapsibleTrigger asChild>
                                        <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-2">
                                          {isExpanded ? (
                                            <ChevronDown className="w-4 h-4" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4" />
                                          )}
                                          Ver pagos ({account.payments.length})
                                        </button>
                                      </CollapsibleTrigger>
                                    )}
                                  </div>

                                  <CollapsibleContent>
                                    <div className="border-t border-border bg-background/50 p-3 space-y-2">
                                      {account.payments.map((payment) => (
                                        <div
                                          key={payment.id}
                                          className="flex items-start justify-between text-sm p-2 rounded bg-secondary/30"
                                        >
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-success">
                                                ${payment.amount.toLocaleString()}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                - {getPaymentMethodLabel(payment.paymentMethod)}
                                              </span>
                                            </div>
                                            {payment.notes && (
                                              <p className="text-xs text-muted-foreground italic">
                                                "{payment.notes}"
                                              </p>
                                            )}
                                          </div>
                                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {customerMetrics.accountsByMonth.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Receipt className="w-10 h-10 mb-3 opacity-50" />
                      <p className="text-sm">Este cliente no tiene cuentas registradas</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : null}
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedAccount && (
                <>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-sm text-muted-foreground">Venta</p>
                    <p className="font-medium font-mono">
                      {selectedAccount.sale?.saleNumber}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">Saldo Pendiente</p>
                    <p className="text-2xl font-bold text-destructive">
                      ${selectedAccount.currentBalance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label>Monto a Pagar</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      min={0}
                      max={selectedAccount.currentBalance}
                    />
                  </div>
                  <div>
                    <Label>Método de Pago</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { value: "CASH" as const, icon: Banknote, label: "Efectivo" },
                        { value: "CARD" as const, icon: CreditCard, label: "Tarjeta" },
                        { value: "TRANSFER" as const, icon: Building2, label: "Transfer" },
                      ].map(({ value, icon: Icon, label }) => (
                        <Button
                          key={value}
                          type="button"
                          variant={paymentMethod === value ? "default" : "outline"}
                          className="flex-col h-auto py-2 sm:py-3 gap-1"
                          onClick={() => setPaymentMethod(value)}
                        >
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-xs">{label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Notas (opcional)</Label>
                    <Textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Ej: Abono parcial, Pago con tarjeta de crédito..."
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleRegisterPayment}
                disabled={paymentMutation.isPending || paymentAmount <= 0}
              >
                {paymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Registrar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                ¿Eliminar Cliente?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="font-medium text-foreground mb-2">
                  {customerToDelete?.customer.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {customerToDelete?.customer.identifier}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Esta acción eliminará permanentemente:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Todos los datos del cliente</li>
                  <li>Todas las cuentas corrientes ({customerToDelete?.activeAccounts || 0} activas)</li>
                  <li>Historial completo de deudas y pagos</li>
                  <li>Todas las entregas de dinero registradas</li>
                </ul>
              </div>

              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-sm text-warning-foreground flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-white">
                    <strong >Advertencia:</strong> Esta eliminación impactará directamente en los reportes de ventas y no se puede deshacer.
                  </span>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Eliminar Permanentemente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sale Items Dialog */}
        <Dialog open={isSaleItemsDialogOpen} onOpenChange={setIsSaleItemsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Detalle de Venta {selectedSale?.saleNumber || ""}
              </DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="text-lg font-bold">${selectedSale.subtotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-primary">${selectedSale.total.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Productos ({selectedSale.items.length})</h3>
                  <Button
                    size="sm"
                    onClick={() => handleOpenEditItem()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {selectedSale.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm sm:text-base truncate">{item.productName}</p>
                          {item.isManual && (
                            <Badge variant="outline" className="text-xs shrink-0">Manual</Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                          <span>Cantidad: {item.quantity}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Precio Unit.: ${item.unitPrice.toLocaleString()}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="font-medium text-foreground">
                            Total: ${item.totalPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditItem(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={selectedSale.items.length <= 1}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaleItemsDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit/Add Item Dialog */}
        <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? "Editar Item" : "Agregar Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveItem}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="productName">Nombre del Producto *</Label>
                  <Input
                    id="productName"
                    value={itemProductName}
                    onChange={(e) => setItemProductName(e.target.value)}
                    placeholder="Ej: Coca Cola 2L"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Cantidad *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unitPrice">Precio Unitario *</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={itemUnitPrice}
                      onChange={(e) => setItemUnitPrice(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total del Item</p>
                  <p className="text-xl font-bold">
                    ${(itemQuantity * itemUnitPrice).toLocaleString()}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditItemDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={addItemMutation.isPending || updateItemMutation.isPending}
                >
                  {(addItemMutation.isPending || updateItemMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {selectedItem ? "Actualizar" : "Agregar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
