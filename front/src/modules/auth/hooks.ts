import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { authApi } from './api';
import { useAuthStore } from './store';
import type { LoginCredentials, RegisterData } from './types';

export function useLogin() {
  const login = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      login(data.user, data.token);
      queryClient.invalidateQueries();
      notifications.show({
        title: '¡Bienvenido!',
        message: 'Has iniciado sesión correctamente',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al iniciar sesión',
        color: 'red',
      });
    },
  });
}

export function useRegister() {
  const login = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (data) => {
      login(data.user, data.token);
      queryClient.invalidateQueries();
      notifications.show({
        title: 'Registro exitoso',
        message: 'Tu cuenta ha sido creada correctamente',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al registrarse',
        color: 'red',
      });
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      notifications.show({
        title: 'Sesión cerrada',
        message: 'Has cerrado sesión correctamente',
        color: 'blue',
      });
    },
  });
}

export function useCurrentUser() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await authApi.me();
      setUser(user);
      return user;
    },
    enabled: !!token,
  });
}

