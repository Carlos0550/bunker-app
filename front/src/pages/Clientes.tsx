import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { customersApi, BusinessCustomer, CurrentAccount, SaleItem, SaleWithItems } from "@/api/services/customers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Users,
  Loader2,
  Banknote,
  Edit3,
  FileText,
  Receipt,
  Trash,
  CheckCircle,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

// Import centralized hooks
import {
  useCustomers,
  useAccountsSummary,
  useCustomerMetrics,
  useCreateCustomer,
  useUpdateCustomerNotes,
  useDeleteCustomer,
  useRegisterPayment,
  useUpdateAccountNotes,
  useAddSaleItem,
  useUpdateSaleItem,
  useDeleteSaleItem,
} from "@/api/hooks";

// Import components
import { LoadingContainer, StatsCard, StatsGrid, ConfirmDialog } from "@/components/shared";
import {
  CustomerFormDialog,
  CustomerList,
  CustomerMetricsCards,
  PaymentDialog,
  AccountCard,
} from "@/components/clientes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  // Search and selection state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<BusinessCustomer | null>(null);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaleItemsDialogOpen, setIsSaleItemsDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  
  // Selected items state
  const [selectedAccount, setSelectedAccount] = useState<CurrentAccount | null>(null);
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<BusinessCustomer | null>(null);
  
  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  
  // Notes state
  const [customerNotes, setCustomerNotes] = useState("");
  const [editingAccountNotes, setEditingAccountNotes] = useState<string | null>(null);
  const [accountNotes, setAccountNotes] = useState("");
  
  // Item form state
  const [itemProductName, setItemProductName] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnitPrice, setItemUnitPrice] = useState(0);
  
  // Expanded accounts state
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  
  // Loading states
  const [isLoadingSaleItems, setIsLoadingSaleItems] = useState(false);
  
  // ============================================================================
  // Queries using centralized hooks
  // ============================================================================
  
  const { data: customersData, isLoading: loadingCustomers } = useCustomers(searchTerm);
  const { data: summary, isLoading: loadingSummary } = useAccountsSummary();
  const { data: customerMetrics, isLoading: loadingMetrics } = useCustomerMetrics(selectedCustomer?.id);
  
  // ============================================================================
  // Mutations using centralized hooks
  // ============================================================================
  
  const createMutation = useCreateCustomer();
  const updateNotesMutation = useUpdateCustomerNotes();
  const deleteMutation = useDeleteCustomer();
  const paymentMutation = useRegisterPayment();
  const updateAccountNotesMutation = useUpdateAccountNotes();
  const addItemMutation = useAddSaleItem();
  const updateItemMutation = useUpdateSaleItem();
  const deleteItemMutation = useDeleteSaleItem();
  
  // ============================================================================
  // Derived data
  // ============================================================================
  
  const customers = customersData?.data || [];
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  useEffect(() => {
    if (createMutation.isSuccess) {
      setIsDialogOpen(false);
    }
  }, [createMutation.isSuccess]);
  
  useEffect(() => {
    if (updateNotesMutation.isSuccess) {
      setIsEditingNotes(false);
    }
  }, [updateNotesMutation.isSuccess]);
  
  useEffect(() => {
    if (paymentMutation.isSuccess) {
      setIsPaymentOpen(false);
      setSelectedAccount(null);
      setPaymentAmount(0);
      setPaymentNotes("");
    }
  }, [paymentMutation.isSuccess]);
  
  useEffect(() => {
    if (deleteMutation.isSuccess) {
      setSelectedCustomer(null);
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  }, [deleteMutation.isSuccess]);
  
  useEffect(() => {
    if (updateAccountNotesMutation.isSuccess) {
      setEditingAccountNotes(null);
    }
  }, [updateAccountNotesMutation.isSuccess]);
  
  // ============================================================================
  // Handlers
  // ============================================================================
  
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
  
  const handleSelectCustomer = (customer: BusinessCustomer) => {
    setSelectedCustomer(customer);
    setCustomerNotes(customer.notes || "");
    setIsEditingNotes(false);
    setExpandedAccounts(new Set());
  };
  
  const handleOpenDeleteDialog = (customer: BusinessCustomer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };
  
  const handleOpenPayment = (account: CurrentAccount) => {
    setSelectedAccount(account);
    setPaymentAmount(account.currentBalance);
    setPaymentMethod("CASH");
    setPaymentNotes("");
    setIsPaymentOpen(true);
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
  
  const handleEditAccountNotes = (account: CurrentAccount) => {
    setEditingAccountNotes(account.id);
    setAccountNotes(account.notes || "");
  };
  
  const handleSaveAccountNotes = (accountId: string) => {
    updateAccountNotesMutation.mutate({ accountId, notes: accountNotes });
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
  
  // Item handlers
  const resetItemForm = () => {
    setSelectedItem(null);
    setItemProductName("");
    setItemQuantity(1);
    setItemUnitPrice(0);
  };
  
  const handleOpenEditItem = (item?: SaleItem) => {
    if (item) {
      setSelectedItem(item);
      setItemProductName(item.productName);
      setItemQuantity(item.quantity);
      setItemUnitPrice(item.unitPrice);
    } else {
      resetItemForm();
    }
    setIsEditItemDialogOpen(true);
  };
  
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    
    const data = {
      productName: itemProductName,
      quantity: itemQuantity,
      unitPrice: itemUnitPrice,
      isManual: true,
    };
    
    if (selectedItem) {
      updateItemMutation.mutate({ itemId: selectedItem.id, data }, {
        onSuccess: async () => {
          const updatedSale = await customersApi.getSaleItems(selectedSale.id);
          setSelectedSale(updatedSale);
          setIsEditItemDialogOpen(false);
          resetItemForm();
        },
      });
    } else {
      addItemMutation.mutate({ saleId: selectedSale.id, data }, {
        onSuccess: async () => {
          const updatedSale = await customersApi.getSaleItems(selectedSale.id);
          setSelectedSale(updatedSale);
          setIsEditItemDialogOpen(false);
          resetItemForm();
        },
      });
    }
  };
  
  const handleDeleteItem = (itemId: string) => {
    if (window.confirm("¿Estás seguro de eliminar este item?")) {
      deleteItemMutation.mutate(itemId, {
        onSuccess: async () => {
          if (selectedSale) {
            const updatedSale = await customersApi.getSaleItems(selectedSale.id);
            setSelectedSale(updatedSale);
          }
        },
      });
    }
  };
  
  // ============================================================================
  // Helper functions
  // ============================================================================
  
  const getDaysInfo = (account: CurrentAccount) => {
    const days = differenceInDays(new Date(), new Date(account.createdAt));
    if (days <= 7) return { text: `${days} día${days !== 1 ? "s" : ""} de antigüedad`, color: "text-muted-foreground" };
    if (days <= 30) return { text: `${days} días de antigüedad`, color: "text-warning" };
    return { text: `${days} días de antigüedad`, color: "text-destructive" };
  };
  
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH": return "Efectivo";
      case "CARD": return "Tarjeta";
      case "TRANSFER": return "Transferencia";
      default: return method;
    }
  };
  
  // ============================================================================
  // Render
  // ============================================================================
  
  return (
    <MainLayout title="Clientes">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-2" data-tour="clientes-header">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Clientes y Cuentas</h1>
            <p className="text-sm text-muted-foreground">
              {customers.length} cliente{customers.length !== 1 ? "s" : ""} • 
              {summary?.pendingAccounts || 0} cuenta{(summary?.pendingAccounts || 0) !== 1 ? "s" : ""} pendiente{(summary?.pendingAccounts || 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" className="h-8 sm:h-9" onClick={() => setIsDialogOpen(true)} data-tour="clientes-add">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Cliente</span>
          </Button>
        </div>
        
        {/* Summary Stats */}
        <StatsGrid columns={4} data-tour="clientes-stats">
          <StatsCard
            title="Total Clientes"
            value={customers.length}
            icon={Users}
            iconBgColor="bg-primary/20"
            iconColor="text-primary"
          />
          <StatsCard
            title="Deuda Total"
            value={`$${(summary?.totalDebt || 0).toLocaleString()}`}
            icon={Banknote}
            iconBgColor="bg-destructive/20"
            iconColor="text-destructive"
          />
          <StatsCard
            title="Cuentas Pendientes"
            value={summary?.pendingAccounts || 0}
            icon={Receipt}
            iconBgColor="bg-warning/20"
            iconColor="text-warning"
          />
          <StatsCard
            title="Cuentas Pagadas"
            value={summary?.paidAccounts || 0}
            icon={CheckCircle}
            iconBgColor="bg-success/20"
            iconColor="text-success"
          />
        </StatsGrid>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Customer List */}
          <CustomerList
            customers={customers}
            selectedCustomerId={selectedCustomer?.id}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSelectCustomer={handleSelectCustomer}
            onDeleteCustomer={handleOpenDeleteDialog}
            isLoading={loadingCustomers}
          />
          
          {/* Customer Detail Panel */}
          <div className="lg:col-span-2 bunker-card min-h-[400px]">
            {!selectedCustomer ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
                <Users className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Selecciona un cliente</p>
                <p className="text-sm">Elige un cliente de la lista para ver sus detalles</p>
              </div>
            ) : loadingMetrics ? (
              <LoadingContainer className="h-full" />
            ) : customerMetrics ? (
              <ScrollArea className="h-full max-h-[calc(100vh-300px)]">
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Customer Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{customerMetrics.customer.name}</h2>
                      <p className="text-sm text-muted-foreground font-mono">{customerMetrics.customer.identifier}</p>
                      {customerMetrics.customer.phone && (
                        <p className="text-sm text-muted-foreground mt-1">{customerMetrics.customer.phone}</p>
                      )}
                      {customerMetrics.customer.email && (
                        <p className="text-sm text-muted-foreground">{customerMetrics.customer.email}</p>
                      )}
                    </div>
                    {customerMetrics.creditLimit && (
                      <Badge variant="outline" className="shrink-0">
                        Límite: ${customerMetrics.creditLimit.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Customer Metrics */}
                  <CustomerMetricsCards
                    totalDebt={customerMetrics.totalDebt}
                    totalPaid={customerMetrics.totalPaid}
                    averagePaymentDays={customerMetrics.averagePaymentDays}
                    totalAccountsCount={customerMetrics.totalAccountsCount}
                  />
                  
                  {/* Notes Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">Notas del cliente</h3>
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
                          placeholder="Agregar notas sobre el cliente..."
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingNotes(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveNotes}
                            disabled={updateNotesMutation.isPending}
                          >
                            {updateNotesMutation.isPending && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                  
                  {/* Accounts by Month */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Cuentas Corrientes</h3>
                    {customerMetrics.accountsByMonth.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">Sin cuentas corrientes</p>
                      </div>
                    ) : (
                      customerMetrics.accountsByMonth.map((monthGroup) => {
                        const [year, month] = monthGroup.monthKey.split("-");
                        return (
                          <div key={monthGroup.monthKey} className="space-y-2">
                            <h4 className="text-sm font-semibold text-foreground">
                              {MONTH_NAMES[month]} {year}
                            </h4>
                            <div className="space-y-2">
                              {monthGroup.accounts.map((account) => (
                                <AccountCard
                                  key={account.id}
                                  account={account}
                                  isExpanded={expandedAccounts.has(account.id)}
                                  onToggleExpanded={() => toggleAccountExpanded(account.id)}
                                  onRegisterPayment={() => handleOpenPayment(account)}
                                  onViewItems={handleViewSaleItems}
                                  editingNotes={editingAccountNotes === account.id}
                                  notes={accountNotes}
                                  onNotesChange={setAccountNotes}
                                  onSaveNotes={() => handleSaveAccountNotes(account.id)}
                                  onCancelNotes={() => setEditingAccountNotes(null)}
                                  onStartEditNotes={() => handleEditAccountNotes(account)}
                                  isSavingNotes={updateAccountNotesMutation.isPending}
                                  getDaysInfo={getDaysInfo}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </ScrollArea>
            ) : null}
          </div>
        </div>
        
        {/* Customer Form Dialog */}
        <CustomerFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveCustomer}
          isLoading={createMutation.isPending}
        />
        
        {/* Payment Dialog */}
        <PaymentDialog
          open={isPaymentOpen}
          onOpenChange={setIsPaymentOpen}
          account={selectedAccount}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          paymentNotes={paymentNotes}
          setPaymentNotes={setPaymentNotes}
          onSave={handleRegisterPayment}
          isLoading={paymentMutation.isPending}
        />
        
        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Eliminar Cliente"
          description={`¿Estás seguro de que deseas eliminar a "${customerToDelete?.customer.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={handleConfirmDelete}
          isLoading={deleteMutation.isPending}
          variant="destructive"
        />
        
        {/* Sale Items Dialog */}
        <Dialog open={isSaleItemsDialogOpen} onOpenChange={setIsSaleItemsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Items de la Venta</DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary/30 text-sm">
                  <p className="text-muted-foreground">Venta #{selectedSale.saleNumber}</p>
                  <p className="font-semibold">Total: ${selectedSale.total.toLocaleString()}</p>
                </div>
                
                <div className="space-y-2">
                  {selectedSale.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x ${item.unitPrice.toLocaleString()} = ${item.totalPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditItem(item)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full" onClick={() => handleOpenEditItem()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Item
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Edit Item Dialog */}
        <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{selectedItem ? "Editar Item" : "Agregar Item"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <Label>Nombre del producto</Label>
                <Input
                  value={itemProductName}
                  onChange={(e) => setItemProductName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label>Precio unitario</Label>
                  <Input
                    type="number"
                    min={0}
                    value={itemUnitPrice}
                    onChange={(e) => setItemUnitPrice(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="p-2 rounded bg-secondary/30 text-sm">
                Total: ${(itemQuantity * itemUnitPrice).toLocaleString()}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditItemDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addItemMutation.isPending || updateItemMutation.isPending}>
                  {(addItemMutation.isPending || updateItemMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
