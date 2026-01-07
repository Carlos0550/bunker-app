import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { notifications } from '@mantine/notifications';

 
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

 
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

 
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

 
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
     
    if (!error.response) {
      notifications.show({
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor',
        color: 'red',
      });
      return Promise.reject(error);
    }

     
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      notifications.show({
        title: 'Sesión expirada',
        message: 'Por favor, inicia sesión nuevamente',
        color: 'yellow',
      });
      return Promise.reject(error);
    }

     
    if (error.response.status === 403) {
      notifications.show({
        title: 'Acceso denegado',
        message: 'No tienes permisos para realizar esta acción',
        color: 'red',
      });
      return Promise.reject(error);
    }

     
    if (error.response.status >= 500) {
      notifications.show({
        title: 'Error del servidor',
        message: 'Ocurrió un error en el servidor. Intenta nuevamente más tarde',
        color: 'red',
      });
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

