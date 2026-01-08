import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

export const ProtectedRoute = () => {
  const { isAuthenticated, token } = useAuthStore();
  const location = useLocation();

  // Verificamos si hay token y si el estado dice que está autenticado
  if (!isAuthenticated || !token) {
    // Redirigir al login, guardando la ubicación intentada para volver después
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
