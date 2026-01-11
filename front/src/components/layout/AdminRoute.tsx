import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authApi } from "@/api/services/auth";
import { useAuthStore } from "@/store/useAuthStore";

type GuardStatus = "pending" | "allowed";

export const AdminRoute = () => {
  const location = useLocation();
  const { token, isAuthenticated, login, logout } = useAuthStore();
  const [status, setStatus] = useState<GuardStatus>("pending");
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      setRedirectTo("/login");
      return;
    }

    let active = true;

    const verifySuperAdmin = async () => {
      try {
        const freshUser = await authApi.getCurrentUser();

        if (!active) {
          return;
        }

        if (freshUser.role !== 0) {
          setRedirectTo("/dashboard");
          return;
        }

        login(token, freshUser);
        setStatus("allowed");
      } catch (error) {
        if (!active) {
          return;
        }

        logout();
        setRedirectTo("/login");
      }
    };

    verifySuperAdmin();

    return () => {
      active = false;
    };
  }, [token, isAuthenticated, login, logout]);

  if (redirectTo) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (status !== "allowed") {
    return null;
  }

  return <Outlet />;
};
