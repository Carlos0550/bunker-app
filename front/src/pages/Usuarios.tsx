import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { User, usersApi, CreateUserData } from "@/api/services/users";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users as UsersIcon,
  Plus,
  Edit2,
  Trash2,
  Shield,
  User as UserIcon,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_PERMISSIONS = ["POS", "PRODUCTOS", "VENTAS", "CLIENTES", "REPORTES", "CONFIGURACION"];

const PRESET_ROLES = [
  { id: "cajero", name: "Cajero", permissions: ["POS", "VENTAS"] },
  { id: "vendedor", name: "Vendedor", permissions: ["POS", "VENTAS", "CLIENTES"] },
  { id: "inventario", name: "Inventario", permissions: ["PRODUCTOS"] },
  { id: "gerente", name: "Gerente", permissions: ["POS", "PRODUCTOS", "VENTAS", "CLIENTES", "REPORTES"] },
];

const PERMISSION_LABELS: Record<string, string> = {
  POS: "Punto de Venta",
  PRODUCTOS: "Productos",
  VENTAS: "Ventas",
  CLIENTES: "Clientes",
  REPORTES: "Reportes",
  CONFIGURACION: "Configuración",
};

export default function Usuarios() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number>(2);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", currentUser?.businessId],
    queryFn: () => usersApi.getUsersByBusiness(currentUser?.businessId || ""),
    enabled: !!currentUser?.businessId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario creado exitosamente. Se envió un email de verificación.");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al crear usuario");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario actualizado exitosamente");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al actualizar usuario");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al eliminar usuario");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "" });
    setSelectedRole(2);
    setSelectedPermissions([]);
    setSelectedPreset("custom");
    setEditingUser(null);
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    if (presetId === "custom") return;
    
    const preset = PRESET_ROLES.find(r => r.id === presetId);
    if (preset) {
      setSelectedPermissions(preset.permissions);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setSelectedPreset("custom");
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast.error("Nombre y email son requeridos");
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error("La contraseña es requerida para nuevos usuarios");
      return;
    }

    let finalRole = selectedRole;
    let finalPermissions = selectedPermissions;

    // Si es usuario y tiene todos los permisos, cambiar a admin
    if (selectedRole === 2 && selectedPermissions.length === ALL_PERMISSIONS.length) {
      finalRole = 1;
      finalPermissions = [];
      toast.info("Se cambió automáticamente a Administrador porque tiene todos los permisos");
    }

    const userData: any = {
      name: formData.name,
      email: formData.email,
      role: finalRole,
      permissions: finalRole === 1 ? [] : finalPermissions,
      businessId: currentUser?.businessId,
    };

    if (formData.password) {
      userData.password = formData.password;
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: userData });
    } else {
      createMutation.mutate(userData as CreateUserData);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
    });
    setSelectedRole(user.role);
    setSelectedPermissions(user.permissions || []);
    setSelectedPreset("custom");
    setIsDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    if (confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const getRoleBadge = (role: number) => {
    if (role === 0) return <Badge variant="default" className="bg-purple-500">Super Admin</Badge>;
    if (role === 1) return <Badge variant="default">Administrador</Badge>;
    return <Badge variant="secondary">Usuario</Badge>;
  };

  const getStatusBadge = (status: string, emailVerified: boolean) => {
    if (status === "DELETED") return <Badge variant="destructive">Eliminado</Badge>;
    if (status === "INACTIVE") return <Badge variant="secondary">Inactivo</Badge>;
    if (!emailVerified) return <Badge variant="outline" className="text-warning">Sin verificar</Badge>;
    return <Badge variant="default" className="bg-green-500">Activo</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <UsersIcon className="w-8 h-8" />
              Gestión de Usuarios
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra los usuarios y permisos de tu negocio
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Tabla de usuarios */}
        <div className="bunker-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium text-foreground">No hay usuarios</p>
              <p className="text-muted-foreground mb-4">
                Crea usuarios para tu equipo
              </p>
              <Button onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primer usuario
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Usuario</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Rol</TableHead>
                  <TableHead className="text-muted-foreground">Permisos</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.role === 1 ? (
                        <Badge variant="outline" className="text-xs">Acceso completo</Badge>
                      ) : user.permissions.length === 0 ? (
                        <Badge variant="secondary" className="text-xs">Sin permisos</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.slice(0, 2).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {PERMISSION_LABELS[perm] || perm}
                            </Badge>
                          ))}
                          {user.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status, user.emailVerified)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(user)}
                          disabled={user.id === currentUser?.id}
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

        {/* Dialog para crear/editar usuario */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? "Modifica los datos del usuario"
                  : "Crea un nuevo usuario para tu equipo"
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Datos básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingUser ? "Contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Selección de rol */}
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={selectedRole.toString()}
                  onValueChange={(value) => {
                    const role = parseInt(value);
                    setSelectedRole(role);
                    if (role === 1) {
                      setSelectedPermissions([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>Administrador - Acceso completo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        <span>Usuario - Permisos personalizados</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permisos (solo si es usuario) */}
              {selectedRole === 2 && (
                <div className="space-y-4 p-4 border rounded-lg bg-secondary/20">
                  <div>
                    <Label className="text-base font-semibold">Permisos de Acceso</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Selecciona las vistas a las que este usuario tendrá acceso
                    </p>
                  </div>

                  {/* Roles predefinidos */}
                  <div className="space-y-2">
                    <Label className="text-sm">Roles Predefinidos (opcional)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_ROLES.map((preset) => (
                        <Button
                          key={preset.id}
                          type="button"
                          variant={selectedPreset === preset.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePresetChange(preset.id)}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Permisos individuales */}
                  <div className="space-y-3">
                    <Label className="text-sm">O personaliza los permisos:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {ALL_PERMISSIONS.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission}
                            checked={selectedPermissions.includes(permission)}
                            onCheckedChange={() => handlePermissionToggle(permission)}
                          />
                          <label
                            htmlFor={permission}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {PERMISSION_LABELS[permission]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advertencia si tiene todos los permisos */}
                  {selectedPermissions.length === ALL_PERMISSIONS.length && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-blue-400">
                        💡 Este usuario tiene todos los permisos. Se cambiará automáticamente a Administrador al guardar.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingUser ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
