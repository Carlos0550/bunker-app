import { useAuthStore } from '@/store/useAuthStore';
import { Permission } from '@/types';

export const usePermissions = () => {
  const { user } = useAuthStore();

  /**
   * Verifica si el usuario tiene un permiso específico
   * - Super Admin (role 0) y Admin (role 1) tienen todos los permisos
   * - Usuarios (role 2) solo tienen los permisos asignados
   */
  const hasPermission = (permission: Permission | string): boolean => {
    if (!user) return false;

    // Super Admin y Admin tienen todos los permisos
    if (user.role === 0 || user.role === 1) {
      return true;
    }

    // Usuarios (role 2) verifican sus permisos específicos
    if (user.role === 2) {
      return user.permissions?.includes(permission) || false;
    }

    return false;
  };

  /**
   * Verifica si el usuario tiene al menos uno de los permisos proporcionados
   */
  const hasAnyPermission = (permissions: (Permission | string)[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Verifica si el usuario tiene todos los permisos proporcionados
   */
  const hasAllPermissions = (permissions: (Permission | string)[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Verifica si el usuario es Admin o Super Admin
   */
  const isAdmin = (): boolean => {
    return user?.role === 0 || user?.role === 1;
  };

  /**
   * Verifica si el usuario es Super Admin
   */
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
