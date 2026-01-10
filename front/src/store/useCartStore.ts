import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

export interface CartItem extends Product {
  quantity: number;
  maxStock: number; // Stock máximo disponible
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product & { stock: number }) => { success: boolean; message?: string };
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  incrementQuantity: (productId: string) => { success: boolean; message?: string };
  decrementQuantity: (productId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const state = get();
        const existingItem = state.items.find((item) => item.id === product.id);
        const currentQuantity = existingItem?.quantity || 0;
        const availableStock = product.stock;

        // Verificar si hay stock disponible
        if (availableStock <= 0) {
          return { success: false, message: "Producto sin stock disponible" };
        }

        // Verificar si ya se alcanzó el límite
        if (currentQuantity >= availableStock) {
          return { success: false, message: `Stock máximo alcanzado (${availableStock} disponibles)` };
        }

        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1, maxStock: availableStock }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { 
                ...product, 
                quantity: 1, 
                maxStock: availableStock 
              },
            ],
          };
        });

        return { success: true };
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        const state = get();
        const item = state.items.find((i) => i.id === productId);
        
        if (!item) {
          return { success: false, message: "Producto no encontrado en el carrito" };
        }

        // No permitir cantidad menor a 1
        if (quantity < 1) {
          return { success: false, message: "La cantidad mínima es 1" };
        }

        // No permitir exceder el stock
        if (quantity > item.maxStock) {
          return { success: false, message: `Stock máximo: ${item.maxStock} unidades` };
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.id === productId ? { ...i, quantity } : i
          ),
        }));

        return { success: true };
      },

      incrementQuantity: (productId) => {
        const state = get();
        const item = state.items.find((i) => i.id === productId);
        
        if (!item) {
          return { success: false, message: "Producto no encontrado" };
        }

        if (item.quantity >= item.maxStock) {
          return { success: false, message: `Stock máximo: ${item.maxStock} unidades` };
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.id === productId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }));

        return { success: true };
      },

      decrementQuantity: (productId) => {
        const state = get();
        const item = state.items.find((i) => i.id === productId);
        
        if (!item || item.quantity <= 1) return;

        set((state) => ({
          items: state.items.map((i) =>
            i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemQuantity: (productId) => {
        const { items } = get();
        const item = items.find((i) => i.id === productId);
        return item?.quantity || 0;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ 
        items: state.items
      }),
    }
  )
);
