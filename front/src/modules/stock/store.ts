import { create } from 'zustand';
import type { StockFilters } from './types';

interface StockState {
  filters: StockFilters;
  setFilters: (filters: StockFilters) => void;
  clearFilters: () => void;
}

export const useStockStore = create<StockState>((set) => ({
  filters: {},
  
  setFilters: (filters) => set({ filters }),
  
  clearFilters: () => set({ filters: {} }),
}));


