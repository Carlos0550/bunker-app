import { useEffect, useCallback, useMemo, useState } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS, Step } from "react-joyride";
import { useLocation } from "react-router-dom";
import { useTutorialStore, TutorialView } from "@/store/useTutorialStore";
import { getStepsForView } from "./tutorialSteps";

interface TutorialProviderProps {
  children: React.ReactNode;
}


const routeToView: Record<string, TutorialView> = {
  "/dashboard": "dashboard",
  "/pos": "pos",
  "/productos": "productos",
  "/clientes": "clientes",
  "/reportes": "reportes",
  "/configuracion": "configuracion",
};


const elementExists = (target: string | HTMLElement): boolean => {
  let element: HTMLElement | null = null;
  
  if (typeof target === "string") {
    element = document.querySelector(target) as HTMLElement;
  } else {
    element = target;
  }

  
  if (!element) return false;
  
  
  if (window.getComputedStyle(element).display === "none") return false;
  if (window.getComputedStyle(element).visibility === "hidden") return false;
  
  return true;
};


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

  
  const currentView = routeToView[location.pathname];
  const allSteps = useMemo(() => currentTour ? getStepsForView(currentTour) : [], [currentTour]);

  
  useEffect(() => {
    if (isRunning && allSteps.length > 0) {
      
      const timer = setTimeout(() => {
        const valid = filterValidSteps(allSteps);
        if (valid.length === 0) {
          
          stopTutorial();
        } else {
          setValidatedSteps(valid);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setValidatedSteps([]);
    }
  }, [isRunning, allSteps, stopTutorial]);

  
  useEffect(() => {
    if (currentView && !hasSeenTutorial(currentView) && !isRunning) {
      
      const timer = setTimeout(() => {
        startTutorial(currentView);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentView, hasSeenTutorial, isRunning, startTutorial]);

  
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index, action } = data;

      
      if (type === EVENTS.TARGET_NOT_FOUND) {
        const nextIndex = index + 1;
        if (nextIndex < validatedSteps.length) {
          setStepIndex(nextIndex);
        } else {
          stopTutorial();
        }
        return;
      }

      
      if (type === EVENTS.STEP_AFTER) {
        const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
        setStepIndex(nextIndex);
      }

      
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        stopTutorial();
      }

      
      if (action === ACTIONS.CLOSE) {
        stopTutorial();
      }
    },
    [setStepIndex, stopTutorial, validatedSteps.length]
  );

  
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
        disableScrollParentFix
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
            primaryColor: "hsl(45, 100%, 51%)", 
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
            display: "none", 
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
