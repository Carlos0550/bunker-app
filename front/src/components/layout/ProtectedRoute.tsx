import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/types";

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
  const { isAuthenticated, token, user } = useAuthStore();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const location = useLocation();

  // Verificamos si hay token y si el estado dice que está autenticado
  if (!isAuthenticated || !token) {
    // Redirigir al login, guardando la ubicación intentada para volver después
    return <Navigate to="/login" state={{ from: location }} replace />;
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
