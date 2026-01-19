import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  Shield,
  LogOut,
  User as UserIcon,
  Crown,
  Receipt
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { authApi } from "@/api/services/auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileEditModal } from "@/components/ProfileEditModal";
import { useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/types";

const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: null, tourId: "sidebar-dashboard" }, // Todos pueden ver dashboard
  { title: "Punto de Venta", url: "/pos", icon: ShoppingCart, permission: Permission.POS, tourId: "sidebar-pos" },
  { title: "Productos", url: "/productos", icon: Package, permission: Permission.PRODUCTOS, tourId: "sidebar-productos" },
  { title: "Ventas", url: "/reportes?tab=historial", icon: Receipt, permission: Permission.VENTAS, tourId: "sidebar-ventas" },
  { title: "Clientes", url: "/clientes", icon: Users, permission: Permission.CLIENTES, tourId: "sidebar-clientes" },
  { title: "Reportes", url: "/reportes", icon: BarChart3, permission: Permission.REPORTES, tourId: "sidebar-reportes" },
];

const adminOnlyItems = [
  { title: "Usuarios", url: "/usuarios", icon: Users },
];

const configItems = [
  { title: "Configuración", url: "/configuracion", icon: Settings, permission: Permission.CONFIGURACION, tourId: "sidebar-config" },
];

// Items exclusivos para Super Admin (role 0)
const adminMenuItems = [
  { title: "Panel Admin", url: "/admin", icon: Crown },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuthStore();
  const { hasPermission, isAdmin, isSuperAdmin } = usePermissions();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const collapsed = state === "collapsed";

  // Filtrar items del menú según permisos
  const filteredMainMenuItems = mainMenuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const filteredConfigItems = configItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      navigate("/login");
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Forzar logout local incluso si falla la API
      logout();
      navigate("/login");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center bunker-glow">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-sidebar-foreground">BUNKER</span>
              <span className="text-xs text-muted-foreground">Sistema de Gestión</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {!isSuperAdmin() && filteredMainMenuItems.length > 0 && (
        <SidebarGroup data-tour="sidebar-nav">
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
            {!collapsed && "Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title} data-tour={item.tourId}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}

        {/* Admin Only Menu - Para Admins (role 1) */}
        {user?.role === 1 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
              {!collapsed && "Administración"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminOnlyItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-primary font-medium"
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Super Admin Menu - Solo para Super Admin (role 0) */}
        {isSuperAdmin() && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
              {!collapsed && "Super Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-primary font-medium"
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0 text-primary" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!isSuperAdmin() && filteredConfigItems.length > 0 && (
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
            {!collapsed && "Sistema"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredConfigItems.map((item) => (
                <SidebarMenuItem key={item.title} data-tour={item.tourId}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity cursor-pointer"
            title="Editar perfil"
          >
            <Avatar className="w-9 h-9 border border-border flex-shrink-0">
              <AvatarImage src={user?.profilePhoto || ""} alt={user?.name || "Usuario"} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {user?.name ? getInitials(user.name) : <UserIcon className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name || "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "Sin correo"}
                </p>
              </div>
            )}
          </button>
          
          {!collapsed && (
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors group"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
            </button>
          )}
        </div>
        <ProfileEditModal open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen} />
      </SidebarFooter>
    </Sidebar>
  );
}
