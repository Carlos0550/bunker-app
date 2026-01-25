import { useAuthStore } from '@/store/useAuthStore';
import { Permission } from '@/types';

export const usePermissions = () => {
  const { user } = useAuthStore();

  
  const hasPermission = (permission: Permission | string): boolean => {
    if (!user) return false;

    
    if (user.role === 0 || user.role === 1) {
      return true;
    }

    
    if (user.role === 2) {
      if (!user.permissions) return false;
      return user.permissions.some(p => 
        p.toUpperCase() === (permission as string).toUpperCase()
      );
    }

    return false;
  };

  
  const hasAnyPermission = (permissions: (Permission | string)[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  
  const hasAllPermissions = (permissions: (Permission | string)[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  
  const isAdmin = (): boolean => {
    return user?.role === 0 || user?.role === 1;
  };

  
  const isSuperAdmin = (): boolean => {
    return user?.role === 0;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isSuperAdmin,
    userPermissions: user?.permissions || [],
    userRole: user?.role,
  };
};
