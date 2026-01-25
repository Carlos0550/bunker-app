import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';


const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});


client.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    
    if (error.response && error.response.status === 401) {
      
      
      console.warn('Sesión expirada o no autorizada');
    }
    return Promise.reject(error);
  }
);

export default client;
