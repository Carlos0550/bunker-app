import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

export const ProtectedRoute = () => {
  const { isAuthenticated, token, user } = useAuthStore();
  const location = useLocation();

  // Verificamos si hay token y si el estado dice que está autenticado
  if (!isAuthenticated || !token) {
    // Redirigir al login, guardando la ubicación intentada para volver después
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Super Admin solo puede acceder a rutas de admin
  if (user?.role === 0 && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};
