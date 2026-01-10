import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { useCartStore } from "@/store/useCartStore";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('business-storage');
        localStorage.removeItem('cart-storage');
        useCartStore.getState().clearCart()
        set({ token: null, user: null, isAuthenticated: false });
      },
      updateUser: (updatedData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedData } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
