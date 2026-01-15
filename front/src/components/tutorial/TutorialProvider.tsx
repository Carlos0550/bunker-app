import { useEffect, useCallback, useMemo, useState } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS, Step } from "react-joyride";
import { useLocation } from "react-router-dom";
import { useTutorialStore, TutorialView } from "@/store/useTutorialStore";
import { getStepsForView } from "./tutorialSteps";

interface TutorialProviderProps {
  children: React.ReactNode;
}

// Mapeo de rutas a vistas del tutorial
const routeToView: Record<string, TutorialView> = {
  "/dashboard": "dashboard",
  "/pos": "pos",
  "/productos": "productos",
  "/clientes": "clientes",
  "/reportes": "reportes",
};

// Función para verificar si un elemento existe en el DOM
const elementExists = (target: string | HTMLElement): boolean => {
  if (typeof target === "string") {
    return document.querySelector(target) !== null;
  }
  return target !== null;
};

// Filtrar pasos que tienen elementos existentes en el DOM
const filterValidSteps = (steps: Step[]): Step[] => {
  return steps.filter((step) => {
    const target = step.target;
    return elementExists(target as string | HTMLElement);
  });
};

export function TutorialProvider({ children }: TutorialProviderProps) {
  const location = useLocation();
  const {
    isRunning,
    currentTour,
    stepIndex,
    startTutorial,
    stopTutorial,
    setStepIndex,
    hasSeenTutorial,
  } = useTutorialStore();

  const [validatedSteps, setValidatedSteps] = useState<Step[]>([]);

  // Obtener la vista actual basada en la ruta
  const currentView = routeToView[location.pathname];
  const allSteps = useMemo(() => currentTour ? getStepsForView(currentTour) : [], [currentTour]);

  // Filtrar pasos válidos cuando cambian los steps o cuando se inicia el tutorial
  useEffect(() => {
    if (isRunning && allSteps.length > 0) {
      // Dar tiempo para que el DOM se actualice
      const timer = setTimeout(() => {
        const valid = filterValidSteps(allSteps);
        setValidatedSteps(valid);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setValidatedSteps([]);
    }
  }, [isRunning, allSteps]);

  // Auto-iniciar tutorial para nuevas vistas
  useEffect(() => {
    if (currentView && !hasSeenTutorial(currentView) && !isRunning) {
      // Delay más largo para asegurar que los elementos estén renderizados
      const timer = setTimeout(() => {
        startTutorial(currentView);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentView, hasSeenTutorial, isRunning, startTutorial]);

  // Callback de Joyride
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index, action } = data;

      // Si el elemento no se encuentra, saltar al siguiente
      if (type === EVENTS.TARGET_NOT_FOUND) {
        const nextIndex = index + 1;
        if (nextIndex < validatedSteps.length) {
          setStepIndex(nextIndex);
        } else {
          stopTutorial();
        }
        return;
      }

      // Manejo de navegación
      if (type === EVENTS.STEP_AFTER) {
        const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
        setStepIndex(nextIndex);
      }

      // Manejo de finalización
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        stopTutorial();
      }

      // Manejo de cierre manual
      if (action === ACTIONS.CLOSE) {
        stopTutorial();
      }
    },
    [setStepIndex, stopTutorial, validatedSteps.length]
  );

  // Solo mostrar Joyride si hay pasos válidos
  const shouldShowTutorial = isRunning && validatedSteps.length > 0;

  return (
    <>
      {children}
      <Joyride
        steps={validatedSteps}
        run={shouldShowTutorial}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        disableOverlayClose
        spotlightClicks
        callback={handleJoyrideCallback}
        locale={{
          back: "Anterior",
          close: "Cerrar",
          last: "Finalizar",
          next: "Siguiente",
          skip: "Omitir tutorial",
          open: "Abrir diálogo",
        }}
        styles={{
          options: {
            arrowColor: "hsl(var(--card))",
            backgroundColor: "hsl(var(--card))",
            overlayColor: "rgba(0, 0, 0, 0.75)",
            primaryColor: "hsl(45, 100%, 51%)", // Color primary amarillo
            textColor: "hsl(var(--foreground))",
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: "12px",
            padding: "20px",
          },
          tooltipContainer: {
            textAlign: "left",
          },
          tooltipTitle: {
            fontSize: "18px",
            fontWeight: 600,
            marginBottom: "8px",
            color: "hsl(45, 100%, 51%)",
          },
          tooltipContent: {
            fontSize: "14px",
            lineHeight: "1.6",
          },
          buttonNext: {
            backgroundColor: "hsl(45, 100%, 51%)",
            color: "hsl(0, 0%, 0%)",
            borderRadius: "8px",
            padding: "8px 16px",
            fontWeight: 500,
          },
          buttonBack: {
            color: "hsl(var(--muted-foreground))",
            marginRight: "8px",
          },
          buttonSkip: {
            color: "hsl(var(--muted-foreground))",
            fontSize: "13px",
          },
          buttonClose: {
            color: "hsl(var(--muted-foreground))",
          },
          spotlight: {
            borderRadius: "8px",
          },
          beacon: {
            display: "none", // Ocultamos beacons ya que usamos disableBeacon en steps
          },
        }}
        floaterProps={{
          styles: {
            floater: {
              filter: "drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))",
            },
          },
        }}
      />
    </>
  );
}
