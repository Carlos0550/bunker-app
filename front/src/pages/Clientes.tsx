import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { customersApi, BusinessCustomer, CurrentAccount } from "@/api/services/customers";
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
  Users,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Eye,
  Loader2,
  Banknote,
  Building2,
  Receipt,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function Clientes() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<BusinessCustomer | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<CurrentAccount | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [accountsFilter, setAccountsFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("clientes");

  // Queries
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers", currentPage, searchTerm],
    queryFn: () =>
      customersApi.getCustomers({
        search: searchTerm || undefined,
        page: currentPage,
        limit: 20,
      }),
  });

  const { data: accountsData, isLoading: loadingAccounts } = useQuery({
    queryKey: ["currentAccounts", accountsFilter],
    queryFn: () =>
      customersApi.getCurrentAccounts({
        status: accountsFilter !== "all" ? accountsFilter : undefined,
        page: 1,
        limit: 50,
      }),
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["accountsSummary"],
    queryFn: () => customersApi.getAccountsSummary(),
  });

  const { data: customerDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["customerDetail", selectedCustomer?.id],
    queryFn: () =>
      selectedCustomer ? customersApi.getCustomerDetail(selectedCustomer.id) : null,
    enabled: !!selectedCustomer && isDetailOpen,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => customersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente creado exitosamente");
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al crear cliente");
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
      queryClient.invalidateQueries({ queryKey: ["currentAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["accountsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["customerDetail"] });
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

  const customers = customersData?.data || [];
  const accounts = accountsData?.data || [];
  const pagination = customersData?.pagination;

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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Clientes</p>
                  <p className="text-2xl font-bold text-foreground">{customers.length}</p>
                </div>
              </div>
            </div>
            <div className="stat-card border-destructive/30">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-destructive/20">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deuda Total</p>
                  <p className="text-2xl font-bold text-destructive">
                    ${summary.totalDebt.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-warning/20">
                  <CreditCard className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cuentas Activas</p>
                  <p className="text-2xl font-bold text-foreground">
                    {summary.pendingAccounts + summary.partialAccounts}
                  </p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-success/20">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cuentas Pagadas</p>
                  <p className="text-2xl font-bold text-success">{summary.paidAccounts}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="cuentas">
              Cuentas Corrientes
              {summary && (summary.pendingAccounts + summary.partialAccounts) > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {summary.pendingAccounts + summary.partialAccounts}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Clientes Tab */}
          <TabsContent value="clientes" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula, teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>

            <div className="bunker-card overflow-hidden">
              {loadingCustomers ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <Users className="w-12 h-12 mb-4 opacity-50" />
                  <p>No hay clientes registrados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Cliente</TableHead>
                      <TableHead className="text-muted-foreground">Identificador</TableHead>
                      <TableHead className="text-muted-foreground">Contacto</TableHead>
                      <TableHead className="text-muted-foreground text-right">Deuda Activa</TableHead>
                      <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((bc) => (
                      <TableRow key={bc.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{bc.customer.name}</p>
                              {bc.notes && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {bc.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {bc.customer.identifier}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {bc.customer.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{bc.customer.phone}</span>
                              </div>
                            )}
                            {bc.customer.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{bc.customer.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {(bc.totalDebt || 0) > 0 ? (
                            <span className="font-bold text-destructive">
                              ${bc.totalDebt?.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-success">Sin deuda</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCustomer(bc);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Cuentas Corrientes Tab */}
          <TabsContent value="cuentas" className="space-y-4">
            <div className="flex gap-4">
              <Select value={accountsFilter} onValueChange={setAccountsFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="PARTIAL">Parciales</SelectItem>
                  <SelectItem value="PAID">Pagadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bunker-card overflow-hidden">
              {loadingAccounts ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mb-4 opacity-50" />
                  <p>No hay cuentas corrientes</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Cliente</TableHead>
                      <TableHead className="text-muted-foreground">Venta</TableHead>
                      <TableHead className="text-muted-foreground text-right">Original</TableHead>
                      <TableHead className="text-muted-foreground text-right">Pendiente</TableHead>
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                      <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id} className="border-border">
                        <TableCell>
                          <p className="font-medium text-foreground">
                            {account.businessCustomer?.customer.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(account.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-sm">{account.sale?.saleNumber}</p>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${account.originalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={account.currentBalance > 0 ? "text-destructive font-bold" : "text-success"}>
                            ${account.currentBalance.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(account.status)}</TableCell>
                        <TableCell className="text-right">
                          {account.status !== "PAID" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAccount(account);
                                setPaymentAmount(account.currentBalance);
                                setIsPaymentOpen(true);
                              }}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Abonar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Customer Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle del Cliente</DialogTitle>
            </DialogHeader>
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : customerDetail ? (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{customerDetail.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Identificador</p>
                    <p className="font-mono">{customerDetail.customer.identifier}</p>
                  </div>
                  {customerDetail.customer.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p>{customerDetail.customer.phone}</p>
                    </div>
                  )}
                  {customerDetail.customer.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{customerDetail.customer.email}</p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-destructive/10">
                    <p className="text-sm text-muted-foreground">Deuda Actual</p>
                    <p className="text-2xl font-bold text-destructive">
                      ${customerDetail.totalDebt.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10">
                    <p className="text-sm text-muted-foreground">Total Pagado</p>
                    <p className="text-2xl font-bold text-success">
                      ${customerDetail.totalPaid.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Cuentas</p>
                    <p className="text-2xl font-bold">
                      {customerDetail.currentAccounts.length}
                    </p>
                  </div>
                </div>

                {/* Accounts */}
                {customerDetail.currentAccounts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Historial de Cuentas</h4>
                    <div className="space-y-3">
                      {customerDetail.currentAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="p-4 rounded-lg bg-secondary/30 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{account.sale?.saleNumber}</span>
                            {getStatusBadge(account.status)}
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Original: ${account.originalAmount.toLocaleString()}
                            </span>
                            <span className={account.currentBalance > 0 ? "text-destructive" : "text-success"}>
                              Pendiente: ${account.currentBalance.toLocaleString()}
                            </span>
                          </div>
                          {account.payments.length > 0 && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs text-muted-foreground mb-1">Pagos:</p>
                              <div className="space-y-1">
                                {account.payments.slice(0, 3).map((payment) => (
                                  <div key={payment.id} className="flex justify-between text-xs">
                                    <span>
                                      ${payment.amount.toLocaleString()} - {payment.paymentMethod}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {new Date(payment.createdAt).toLocaleDateString("es-ES")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

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
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">
                      {selectedAccount.businessCustomer?.customer.name}
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
                          className="flex-col h-auto py-3 gap-1"
                          onClick={() => setPaymentMethod(value)}
                        >
                          <Icon className="w-5 h-5" />
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
      </div>
    </MainLayout>
  );
}
