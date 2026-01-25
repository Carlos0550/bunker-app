import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { User, CreateUserData } from "@/api/services/users";
import { authApi } from "@/api/services/auth";
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
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";


import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/api/hooks";


import { LoadingContainer, EmptyState, ConfirmDialog } from "@/components/shared";

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
  const { user: currentUser } = useAuthStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number>(2);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [sendingRecovery, setSendingRecovery] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  
  const { data: users = [], isLoading } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  
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

    let finalRole = selectedRole;
    let finalPermissions = selectedPermissions;

    
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
      updateMutation.mutate({ id: editingUser.id, data: userData }, {
        onSuccess: () => {
          resetForm();
          setIsDialogOpen(false);
        },
      });
    } else {
      createMutation.mutate(userData as CreateUserData, {
        onSuccess: () => {
          resetForm();
          setIsDialogOpen(false);
        },
      });
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

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setUserToDelete(null);
        },
      });
    }
  };

  
  const getRoleBadge = (role: number) => {
    if (role === 0) return <Badge variant="default" className="bg-purple-500 whitespace-nowrap">Super Admin</Badge>;
    if (role === 1) return <Badge variant="default" className="whitespace-nowrap">Administrador</Badge>;
    return <Badge variant="secondary" className="whitespace-nowrap">Usuario</Badge>;
  };

  const getStatusBadge = (status: string, emailVerified: boolean) => {
    if (status === "DELETED") return <Badge variant="destructive">Eliminado</Badge>;
    if (status === "INACTIVE") return <Badge variant="secondary">Inactivo</Badge>;
    if (!emailVerified) return <Badge variant="outline" className="text-warning">Sin verificar</Badge>;
    return <Badge variant="default" className="bg-green-500">Activo</Badge>;
  };

  
  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" />
              <span className="truncate">Gestión de Usuarios</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Administra los usuarios y permisos de tu negocio
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Usuario</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>

        {}
        <div className="bunker-card overflow-hidden p-0 w-full max-w-full">
          {isLoading ? (
            <LoadingContainer className="p-8 sm:p-12" />
          ) : users.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={UsersIcon}
                title="No hay usuarios"
                description="Crea usuarios para tu equipo"
                action={
                  <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primer usuario
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {}
              <div className="block md:hidden p-3 sm:p-4 space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="bunker-card p-3 border border-border/50">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <UserIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base text-foreground truncate">{user.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleEdit(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Rol:</span>
                        {getRoleBadge(user.role)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Estado:</span>
                        {getStatusBadge(user.status, user.emailVerified)}
                      </div>
                    </div>
                    {user.role === 2 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground block mb-1">Permisos:</span>
                        {user.permissions.length === 0 ? (
                          <Badge variant="secondary" className="text-xs">Sin permisos</Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.slice(0, 3).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {PERMISSION_LABELS[perm] || perm}
                              </Badge>
                            ))}
                            {user.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{user.permissions.length - 3}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {user.role === 1 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <Badge variant="outline" className="text-xs">Acceso completo</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {}
              <div className="hidden md:block overflow-x-auto">
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
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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
                                <Badge variant="outline" className="text-xs">+{user.permissions.length - 2}</Badge>
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
                              onClick={() => handleDeleteClick(user)}
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
              </div>
            </>
          )}
        </div>

        {}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Modifica los datos del usuario" : "Crea un nuevo usuario para tu equipo"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 sm:space-y-6 py-4">
              {}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {}
              {editingUser ? (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      ¿El usuario olvidó su contraseña?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={sendingRecovery}
                      onClick={async () => {
                        if (!editingUser.email) return;
                        setSendingRecovery(true);
                        try {
                          await authApi.recoverPassword(editingUser.email);
                          toast.success(`Email de recuperación enviado a ${editingUser.email}`);
                        } catch (error: any) {
                          toast.error(error.response?.data?.error?.message || "Error al enviar email");
                        } finally {
                          setSendingRecovery(false);
                        }
                      }}
                    >
                      {sendingRecovery ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      Enviar email de recuperación
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-400">
                    💡 Se generará una contraseña temporal automáticamente y se enviará al correo del usuario.
                  </p>
                </div>
              )}

              {}
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={selectedRole.toString()}
                  onValueChange={(value) => {
                    const role = parseInt(value);
                    setSelectedRole(role);
                    if (role === 1) setSelectedPermissions([]);
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

              {}
              {selectedRole === 2 && (
                <div className="space-y-4 p-4 border rounded-lg bg-secondary/20">
                  <div>
                    <Label className="text-base font-semibold">Permisos de Acceso</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Selecciona las vistas a las que este usuario tendrá acceso
                    </p>
                  </div>

                  {}
                  <div className="space-y-2">
                    <Label className="text-sm">Roles Predefinidos (opcional)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

                  {}
                  <div className="space-y-3">
                    <Label className="text-sm">O personaliza los permisos:</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ALL_PERMISSIONS.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission}
                            checked={selectedPermissions.includes(permission)}
                            onCheckedChange={() => handlePermissionToggle(permission)}
                          />
                          <label
                            htmlFor={permission}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {PERMISSION_LABELS[permission]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

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

        {}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Eliminar Usuario"
          description={`¿Estás seguro de eliminar a "${userToDelete?.name}"?`}
          confirmLabel="Eliminar"
          onConfirm={handleConfirmDelete}
          isLoading={deleteMutation.isPending}
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
