import { BusinessData } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { businessApi } from "@/api/services/business";

interface BusinessState {
    businessData: BusinessData | null;
    isLoading: boolean;
    error: string | null;
    setBusinessData: (businessData: BusinessData | null) => void;
    fetchBusinessData: (businessId: string) => Promise<void>;
}

export const useBusinessStore = create<BusinessState>()(
    persist(
        (set, get) => ({
            businessData: null,
            isLoading: false,
            error: null,
            setBusinessData: (businessData) => set({ businessData }),
            fetchBusinessData: async (businessId: string) => {
                if (!businessId) {
                    set({ error: "Business ID is required", isLoading: false });
                    return;
                }
                set({ isLoading: true, error: null });
                try {
                    const data = await businessApi.getBusiness(businessId) as any;
                    set({ businessData: data, isLoading: false });
                } catch (error) {
                    set({ error: (error as Error).message, isLoading: false });
                }
            }
        }),
        {
            name: "business-storage",
            partialize: (state) => ({ businessData: state.businessData }),
        }
    )
)