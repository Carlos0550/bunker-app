import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '../../modules/auth/store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
     
    initAuth();
  }, [initAuth]);

  return <>{children}</>;
}

