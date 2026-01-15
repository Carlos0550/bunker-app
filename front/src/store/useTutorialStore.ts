import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TutorialView = "dashboard" | "pos" | "productos" | "clientes" | "reportes" | "configuracion" | "sidebar";

interface TutorialState {
  // Record de vistas que el usuario ya ha visto
  seenTutorials: Record<TutorialView, boolean>;
  // Vista del tutorial actual que está corriendo
  currentTour: TutorialView | null;
  // Si el tutorial está activo
  isRunning: boolean;
  // Índice del paso actual
  stepIndex: number;
  
  // Acciones
  startTutorial: (view: TutorialView) => void;
  stopTutorial: () => void;
  markAsSeen: (view: TutorialView) => void;
  setStepIndex: (index: number) => void;
  hasSeenTutorial: (view: TutorialView) => boolean;
  resetAllTutorials: () => void;
  resetTutorial: (view: TutorialView) => void;
}

const initialSeenTutorials: Record<TutorialView, boolean> = {
  dashboard: false,
  pos: false,
  productos: false,
  clientes: false,
  reportes: false,
  configuracion: false,
  sidebar: false,
};

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      seenTutorials: { ...initialSeenTutorials },
      currentTour: null,
      isRunning: false,
      stepIndex: 0,

      startTutorial: (view: TutorialView) => {
        set({
          currentTour: view,
          isRunning: true,
          stepIndex: 0,
        });
      },

      stopTutorial: () => {
        const { currentTour } = get();
        if (currentTour) {
          set((state) => ({
            seenTutorials: {
              ...state.seenTutorials,
              [currentTour]: true,
            },
            currentTour: null,
            isRunning: false,
            stepIndex: 0,
          }));
        } else {
          set({
            currentTour: null,
            isRunning: false,
            stepIndex: 0,
          });
        }
      },

      markAsSeen: (view: TutorialView) => {
        set((state) => ({
          seenTutorials: {
            ...state.seenTutorials,
            [view]: true,
          },
        }));
      },

      setStepIndex: (index: number) => {
        set({ stepIndex: index });
      },

      hasSeenTutorial: (view: TutorialView) => {
        return get().seenTutorials[view];
      },

      resetAllTutorials: () => {
        set({
          seenTutorials: { ...initialSeenTutorials },
          currentTour: null,
          isRunning: false,
          stepIndex: 0,
        });
      },

      resetTutorial: (view: TutorialView) => {
        set((state) => ({
          seenTutorials: {
            ...state.seenTutorials,
            [view]: false,
          },
        }));
      },
    }),
    {
      name: "bunker-tutorial-storage",
      partialize: (state) => ({
        seenTutorials: state.seenTutorials,
      }),
    }
  )
);
