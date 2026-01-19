import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/types";
import { useEffect, useState } from "react";
import { authApi } from "@/api/services/auth";

// Mapeo de rutas a permisos requeridos
const routePermissions: Record<string, Permission | null> = {
  '/dashboard': null, // Todos pueden acceder
  '/pos': Permission.POS,
  '/productos': Permission.PRODUCTOS,
  '/clientes': Permission.CLIENTES,
  '/reportes': Permission.REPORTES,
  '/configuracion': Permission.CONFIGURACION,
};

export const ProtectedRoute = () => {
  const { isAuthenticated, token, user, updateUser, logout } = useAuthStore();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasRefreshed, setHasRefreshed] = useState(false);

  // Refrescar datos del usuario al montar el componente
  useEffect(() => {
    const refreshUserData = async () => {
      if (isAuthenticated && token && !hasRefreshed) {
        setIsRefreshing(true);
        try {
          const freshUser = await authApi.getCurrentUser();
          // Actualizar el store con los datos frescos del usuario
          updateUser(freshUser);
        } catch (error) {
          console.error("Error al refrescar datos del usuario:", error);
          // Si falla por token inválido, hacer logout
          if ((error as any)?.response?.status === 401) {
            logout();
          }
        } finally {
          setIsRefreshing(false);
          setHasRefreshed(true);
        }
      }
    };

    refreshUserData();
  }, [isAuthenticated, token, hasRefreshed, updateUser, logout]);

  // Verificamos si hay token y si el estado dice que está autenticado
  if (!isAuthenticated || !token) {
    // Redirigir al login, guardando la ubicación intentada para volver después
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Mostrar loading mientras se refrescan los datos
  if (isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Super Admin solo puede acceder a rutas de admin
  if (isSuperAdmin() && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

  // Verificar permisos para la ruta actual (solo para usuarios no super admin)
  if (!isSuperAdmin()) {
    const currentPath = location.pathname;
    const requiredPermission = routePermissions[currentPath];

    // Si la ruta requiere un permiso específico, verificarlo
    if (requiredPermission && !hasPermission(requiredPermission)) {
      // Redirigir al dashboard si no tiene permiso
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};
