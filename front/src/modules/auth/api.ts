import { httpClient } from '../../services/http';
import type { LoginCredentials, RegisterData, AuthResponse } from './types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await httpClient.post<AuthResponse>('/users/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await httpClient.post<AuthResponse>('/users/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await httpClient.post('/users/auth/logout');
  },

  me: async (): Promise<AuthResponse['user']> => {
    const response = await httpClient.get<AuthResponse['user']>('/users/auth/me');
    return response.data;
  },
};


