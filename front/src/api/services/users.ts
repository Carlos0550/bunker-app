import client from '../client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: number; // 0=SuperAdmin, 1=Admin, 2=Usuario
  permissions: string[];
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: number;
  permissions?: string[];
  businessId: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: number;
  permissions?: string[];
  status?: string;
}

export const usersApi = {
  getUsersByBusiness: async (businessId: string): Promise<User[]> => {
    const response = await client.get<{ success: boolean; data: User[] }>(
      `/users/business?businessId=${businessId}`
    );
    return response.data.data;
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await client.post<{ success: boolean; data: User }>(
      '/users/create',
      data
    );
    return response.data.data;
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await client.patch<{ success: boolean; data: User }>(
      `/users/${id}`,
      data
    );
    return response.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await client.delete(`/users/${id}`);
  },
};
