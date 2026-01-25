import client from '../client';
import { RegisterData, LoginCredentials, AuthResponse, User } from '@/types';

export const authApi = {
  
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await client.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
    return response.data.data;
  },

  
  register: async (data: RegisterData): Promise<{ user: User }> => {
    const response = await client.post<{ success: boolean; data: { user: User } }>('/auth/register', data);
    return response.data.data;
  },

  
  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
  },

  
  getCurrentUser: async (): Promise<User> => {
    const response = await client.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
  },

  
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await client.patch<{ success: boolean; data: User }>('/', data);
    return response.data.data;
  },

  
  updateProfilePhoto: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await client.patch<{ success: boolean; data: { url: string } }>('/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  recoverPassword: async (email: string): Promise<void> => {
    const qp = new URLSearchParams({ email });
    await client.post(`/auth/recover-password?${qp}`);
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await client.post('/auth/reset-password', { token, newPassword });
  },

  
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await client.get<{ success: boolean; message: string }>(`/auth/verify-email?token=${token}`);
    return response.data;
  },
};
