import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Warehouse, 
  Users, 
  BarChart3, 
  Settings,
  Shield,
  LogOut,
  User as UserIcon
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

const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Punto de Venta", url: "/pos", icon: ShoppingCart },
  { title: "Productos", url: "/productos", icon: Package },
  { title: "Stock", url: "/stock", icon: Warehouse },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Reportes", url: "/reportes", icon: BarChart3 },
];

const configItems = [
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuthStore();
  
  const collapsed = state === "collapsed";

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
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
            {!collapsed && "Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
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

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
            {!collapsed && "Sistema"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
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
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 border border-border">
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
      </SidebarFooter>
    </Sidebar>
  );
}
