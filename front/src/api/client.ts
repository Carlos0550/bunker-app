import axios from 'axios';

// Configuración base de Axios
// Cambia baseURL por la URL de tu backend real cuando esté listo
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token de autenticación a cada petición
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta globalmente
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Aquí puedes manejar errores globales como 401 (No autorizado)
    if (error.response && error.response.status === 401) {
      // Por ejemplo: redirigir al login o limpiar el token
      // localStorage.removeItem('token');
      // window.location.href = '/login';
      console.warn('Sesión expirada o no autorizada');
    }
    return Promise.reject(error);
  }
);

export default client;
