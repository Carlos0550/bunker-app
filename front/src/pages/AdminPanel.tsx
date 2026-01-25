import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import client from "@/api/client";
import { 
  Crown,
  Building2,
  CreditCard,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Check,
  X,
  Settings,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { subscriptionApi } from "@/api/services/subscription";
import { formatCurrency } from "@/utils/helpers";


interface Plan {
  id: string;
  name: string;
  price: number;
  description?: string;
  features: string[];
  isActive: boolean;
  _count?: { businesses: number };
}

interface Business {
  id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  createdAt: string;
  businessPlan?: { id: string; name: string; price: number };
  _count?: { users: number; products: number; sales: number };
  paymentHistory?: { date: string; status: string; nextPaymentDate?: string }[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: number;
  status: string;
  lastLogin?: string;
  createdAt: string;
}

interface SystemStats {
  totals: {
    businesses: number;
    activeBusinesses: number;
    users: number;
    products: number;
    sales: number;
    revenue: number;
  };
  businessesByPlan: { planId: string; planName: string; count: number }[];
  recentPayments: any[];
}


const adminApi = {
  
  getSystemStats: async (): Promise<SystemStats> => {
    const res = await client.get<{ success: boolean; data: SystemStats }>("/admin/stats");
    return res.data.data;
  },

  
  getPlans: async (): Promise<Plan[]> => {
    const res = await client.get<{ success: boolean; data: Plan[] }>("/admin/plans?includeInactive=true");
    return res.data.data;
  },
  getActivePlan: async (): Promise<Plan> => {
    const res = await client.get<{ success: boolean; data: Plan }>("/admin/plans/active");
    return res.data.data;
  },
  createPlan: async (data: Partial<Plan>): Promise<Plan> => {
    const res = await client.post<{ success: boolean; data: Plan }>("/admin/plans", data);
    return res.data.data;
  },
  updatePlan: async ({ id, ...data }: Partial<Plan> & { id: string }): Promise<Plan> => {
    const res = await client.patch<{ success: boolean; data: Plan }>(`/admin/plans/${id}`, data);
    return res.data.data;
  },
  deletePlan: async (id: string): Promise<void> => {
    await client.delete(`/admin/plans/${id}`);
  },

  
  getBusinesses: async (page = 1, search?: string): Promise<{ data: Business[]; pagination: any }> => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.append("search", search);
    const res = await client.get<{ success: boolean; data: Business[]; pagination: any }>(`/admin/businesses?${params}`);
    return { data: res.data.data, pagination: res.data.pagination };
  },
  changeBusinessPlan: async (businessId: string, planId: string): Promise<any> => {
    const res = await client.patch(`/admin/businesses/${businessId}/plan`, { planId });
    return res.data;
  },

  
  getUsersByBusiness: async (businessId: string): Promise<User[]> => {
    const res = await client.get<{ success: boolean; data: User[] }>(`/admin/businesses/${businessId}/users`);
    return res.data.data;
  },
  impersonateUser: async (userId: string): Promise<{ user: User; token: string }> => {
    const res = await client.post<{ success: boolean; data: { user: User; token: string } }>(`/admin/users/${userId}/impersonate`);
    return res.data.data;
  },
};

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [searchBusiness, setSearchBusiness] = useState("");
  const [businessPage, setBusinessPage] = useState(1);
  const [viewingBusinessUsers, setViewingBusinessUsers] = useState<string | null>(null);
  
  
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    price: 0,
    description: "",
    features: "",
  });

  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBusinessForPayment, setSelectedBusinessForPayment] = useState<Business | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, months: 1, notes: "" });

  
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: adminApi.getSystemStats,
  });

  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ["adminPlans"],
    queryFn: adminApi.getPlans,
  });

  const { data: businesses, isLoading: loadingBusinesses } = useQuery({
    queryKey: ["adminBusinesses", businessPage, searchBusiness],
    queryFn: () => adminApi.getBusinesses(businessPage, searchBusiness || undefined),
  });

  
  const createPlanMutation = useMutation({
    mutationFn: adminApi.createPlan,
    onSuccess: () => {
      toast.success("Plan creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["adminPlans"] });
      setShowPlanModal(false);
      resetPlanForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al crear el plan");
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: adminApi.updatePlan,
    onSuccess: () => {
      toast.success("Plan actualizado");
      queryClient.invalidateQueries({ queryKey: ["adminPlans"] });
      setShowPlanModal(false);
      resetPlanForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al actualizar");
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: adminApi.deletePlan,
    onSuccess: () => {
      toast.success("Plan eliminado");
      queryClient.invalidateQueries({ queryKey: ["adminPlans"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al eliminar");
    },
  });

  const manualPaymentMutation = useMutation({
    mutationFn: subscriptionApi.registerManualPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBusinesses"] });
      toast.success("Pago registrado correctamente");
      setShowPaymentModal(false);
    },
    onError: () => {
      toast.error("Error al registrar el pago");
    }
  });

  
  const { data: businessUsers, isLoading: loadingBusinessUsers } = useQuery({
    queryKey: ["adminBusinessUsers", viewingBusinessUsers],
    queryFn: () => adminApi.getUsersByBusiness(viewingBusinessUsers!),
    enabled: !!viewingBusinessUsers,
  });

  const impersonateMutation = useMutation({
    mutationFn: adminApi.impersonateUser,
    onSuccess: (data) => {
      toast.success(`Ingresando como ${data.user.name}...`);
      
      
      localStorage.removeItem("business-storage");
      localStorage.removeItem("cart-storage");
      sessionStorage.clear();
      
      
      const authStorage = {
        state: {
          token: data.token,
          user: data.user,
          isAuthenticated: true,
        },
        version: 0,
      };
      localStorage.setItem("auth-storage", JSON.stringify(authStorage));
      
      
      window.location.replace("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al ingresar como usuario");
    },
  });

  
  const resetPlanForm = () => {
    setPlanForm({ name: "", price: 0, description: "", features: "" });
    setEditingPlan(null);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price: plan.price,
      description: plan.description || "",
      features: plan.features.join("\n"),
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = () => {
    const data = {
      name: planForm.name,
      price: Number(planForm.price),
      description: planForm.description || undefined,
      features: planForm.features.split("\n").filter(f => f.trim()),
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, ...data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const handleTogglePlanActive = (plan: Plan) => {
    updatePlanMutation.mutate({ id: plan.id, isActive: !plan.isActive });
  };

  return (
    <MainLayout title="Panel de Administración">
      <div className="space-y-6">
        {}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Panel de Super Administrador</h1>
            <p className="text-muted-foreground">
              Gestiona planes, negocios y configuración del sistema
            </p>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingStats ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Negocios</p>
                      <p className="text-2xl font-bold">{stats?.totals.businesses || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats?.totals.activeBusinesses || 0} activos
                      </p>
                    </div>
                    <Building2 className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Usuarios</p>
                      <p className="text-2xl font-bold">{stats?.totals.users || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ventas Totales</p>
                      <p className="text-2xl font-bold">{stats?.totals.sales || 0}</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ingresos Sistema</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats?.totals.revenue || 0)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {}
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="plans" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Plan de Pago
            </TabsTrigger>
            <TabsTrigger value="businesses" className="gap-2">
              <Building2 className="w-4 h-4" />
              Negocios
            </TabsTrigger>
          </TabsList>

          {}
          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Gestión del Plan de Pago</h2>
                <p className="text-sm text-muted-foreground">
                  Configura el plan único que se asignará a todos los negocios nuevos (con 7 días de prueba)
                </p>
              </div>
              <Button onClick={() => { resetPlanForm(); setShowPlanModal(true); }} className="bunker-glow">
                <Plus className="w-4 h-4 mr-2" />
                {plans && plans.length > 0 ? "Editar Plan" : "Crear Plan"}
              </Button>
            </div>

            {loadingPlans ? (
              <div className="space-y-2">
                <Skeleton className="h-40" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans && plans.length > 0 ? (
                  plans.map((plan) => (
                    <Card key={plan.id} className={`${!plan.isActive ? "opacity-60" : ""}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {plan.name}
                              {plan.isActive && (
                                <Badge className="bg-green-500/20 text-green-400">Activo</Badge>
                              )}
                              {!plan.isActive && (
                                <Badge variant="outline" className="text-red-400">Inactivo</Badge>
                              )}
                            </CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                          </div>
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(plan.price)}
                            <span className="text-xs font-normal text-muted-foreground">/mes</span>
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          {plan.features && plan.features.length > 0 ? (
                            plan.features.map((feature, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <Check className="w-3 h-3 text-success" />
                                <span className="text-muted-foreground">{feature}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No hay características configuradas
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Badge variant="outline">
                            {plan._count?.businesses || 0} negocios
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPlan(plan)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("¿Eliminar este plan?")) {
                                  deletePlanMutation.mutate(plan.id);
                                }
                              }}
                              disabled={(plan._count?.businesses || 0) > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground mb-4">
                          No hay ningún plan configurado. Crea uno para que los nuevos negocios puedan registrarse.
                        </p>
                        <Button onClick={() => { resetPlanForm(); setShowPlanModal(true); }} className="bunker-glow">
                          <Plus className="w-4 h-4 mr-2" />
                          Crear Plan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {}
          <TabsContent value="businesses" className="space-y-4">
            {viewingBusinessUsers ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setViewingBusinessUsers(null)}>
                     ← Volver a Negocios
                  </Button>
                  <h2 className="text-lg font-semibold">
                    Usuarios de {businesses?.data.find(b => b.id === viewingBusinessUsers)?.name}
                  </h2>
                </div>

                {loadingBusinessUsers ? (
                  <Skeleton className="h-40" />
                ) : (
                  <div className="bunker-card overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {businessUsers?.map((user) => (
                           <TableRow key={user.id}>
                             <TableCell className="font-medium">{user.name}</TableCell>
                             <TableCell>{user.email}</TableCell>
                             <TableCell>
                               {user.role === 1 ? (
                                 <Badge variant="default">Admin</Badge>
                               ) : (
                                 <Badge variant="outline">Cajero</Badge>
                               )}
                             </TableCell>
                             <TableCell>
                               <Badge variant={user.status === "ACTIVE" ? "secondary" : "destructive"}>
                                 {user.status}
                               </Badge>
                             </TableCell>
                             <TableCell className="text-right">
                               <Button 
                                 size="sm" 
                                 variant="outline"
                                 className="bunker-glow border-primary/50 text-primary hover:bg-primary/10"
                                 onClick={() => {
                                   if(confirm(`¿Estás seguro de ingresar como ${user.name}?`)) {
                                     impersonateMutation.mutate(user.id);
                                   }
                                 }}
                                 disabled={impersonateMutation.isPending}
                               >
                                 {impersonateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Users className="w-4 h-4 mr-2" />}
                                 Ingresar
                               </Button>
                             </TableCell>
                           </TableRow>
                         ))}
                         {businessUsers?.length === 0 && (
                           <TableRow>
                             <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                               No hay usuarios registrados
                             </TableCell>
                           </TableRow>
                         )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center gap-4">
                  <h2 className="text-lg font-semibold">Negocios Registrados</h2>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar negocio..."
                      value={searchBusiness}
                      onChange={(e) => setSearchBusiness(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loadingBusinesses ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : (
                  <>
                    <div className="bunker-card overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Negocio</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead className="text-center">Usuarios</TableHead>
                            <TableHead className="text-center">Productos</TableHead>
                            <TableHead className="text-center">Ventas</TableHead>
                            <TableHead>Estado Pago</TableHead>
                            <TableHead>Registrado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {businesses?.data.map((business) => {
                            const lastPayment = business.paymentHistory?.[0];
                            const isOverdue = lastPayment?.nextPaymentDate && 
                              new Date(lastPayment.nextPaymentDate) < new Date();
                            
                            return (
                              <TableRow key={business.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{business.name}</p>
                                    <p className="text-xs text-muted-foreground">{business.contact_email}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {business.businessPlan ? (
                                    <Badge>{business.businessPlan.name}</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-yellow-400">Sin plan</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">{business._count?.users || 0}</TableCell>
                                <TableCell className="text-center">{business._count?.products || 0}</TableCell>
                                <TableCell className="text-center">{business._count?.sales || 0}</TableCell>
                                <TableCell>
                                  {isOverdue ? (
                                    <Badge className="bg-red-500/20 text-red-400">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Vencido
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-500/20 text-green-400">Al día</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {format(new Date(business.createdAt), "dd MMM yyyy", { locale: es })}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setViewingBusinessUsers(business.id)}
                                      title="Ver Usuarios"
                                    >
                                      <Users className="w-4 h-4 text-blue-400" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedBusinessForPayment(business);
                                        setPaymentForm({
                                          amount: business.businessPlan?.price || 0,
                                          months: 1,
                                          notes: ""
                                        });
                                        setShowPaymentModal(true);
                                      }}
                                    >
                                      <CreditCard className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {businesses?.pagination && (
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Mostrando {businesses.data.length} de {businesses.pagination.total}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBusinessPage(p => Math.max(1, p - 1))}
                            disabled={businessPage === 1}
                          >
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBusinessPage(p => p + 1)}
                            disabled={businessPage >= businesses.pagination.totalPages}
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </TabsContent>

        </Tabs>
      </div>

      {}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Plan" : "Nuevo Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Modifica los detalles del plan" : "Crea un nuevo plan de suscripción"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="planName">Nombre</Label>
              <Input
                id="planName"
                value={planForm.name}
                onChange={(e) => setPlanForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Profesional"
              />
            </div>

            <div>
              <Label htmlFor="planPrice">Precio mensual (ARS)</Label>
              <Input
                id="planPrice"
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm(p => ({ ...p, price: Number(e.target.value) }))}
                placeholder="599"
              />
            </div>

            <div>
              <Label htmlFor="planDescription">Descripción</Label>
              <Input
                id="planDescription"
                value={planForm.description}
                onChange={(e) => setPlanForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Para negocios en crecimiento"
              />
            </div>

            <div>
              <Label htmlFor="planFeatures">Características (una por línea)</Label>
              <Textarea
                id="planFeatures"
                value={planForm.features}
                onChange={(e) => setPlanForm(p => ({ ...p, features: e.target.value }))}
                placeholder="Hasta 1,000 productos&#10;5 usuarios&#10;Ventas ilimitadas"
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
              className="bunker-glow"
            >
              {(createPlanMutation.isPending || updatePlanMutation.isPending) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {editingPlan ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago Manual</DialogTitle>
            <DialogDescription>
              Registra un pago manual para {selectedBusinessForPayment?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="paymentAmount">Monto (ARS)</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(p => ({ ...p, amount: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="paymentMonths">Meses a pagar</Label>
              <Input
                id="paymentMonths"
                type="number"
                min="1"
                value={paymentForm.months}
                onChange={(e) => setPaymentForm(p => ({ ...p, months: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="paymentNotes">Notas (Opcional)</Label>
              <Textarea
                id="paymentNotes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Detalles del pago..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedBusinessForPayment) {
                  manualPaymentMutation.mutate({
                    businessId: selectedBusinessForPayment.id,
                    amount: paymentForm.amount,
                    months: paymentForm.months,
                    notes: paymentForm.notes
                  });
                }
              }}
              disabled={manualPaymentMutation.isPending}
            >
              {manualPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
