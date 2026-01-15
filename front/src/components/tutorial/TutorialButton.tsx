import { HelpCircle, RotateCcw } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTutorialStore, TutorialView } from "@/store/useTutorialStore";

// Mapeo de rutas a vistas del tutorial
const routeToView: Record<string, TutorialView> = {
  "/dashboard": "dashboard",
  "/pos": "pos",
  "/productos": "productos",
  "/clientes": "clientes",
  "/reportes": "reportes",
};

// Nombres legibles de las vistas
const viewNames: Record<TutorialView, string> = {
  dashboard: "Dashboard",
  pos: "Punto de Venta",
  productos: "Productos",
  clientes: "Clientes",
  reportes: "Reportes",
  configuracion: "Configuración",
  sidebar: "Navegación",
};

export function TutorialButton() {
  const location = useLocation();
  const { startTutorial, resetTutorial, resetAllTutorials, isRunning } = useTutorialStore();

  const currentView = routeToView[location.pathname];

  const handleStartCurrentTutorial = () => {
    if (currentView && !isRunning) {
      resetTutorial(currentView);
      startTutorial(currentView);
    }
  };

  const handleResetAllTutorials = () => {
    resetAllTutorials();
    // Si hay una vista actual, iniciar su tutorial
    if (currentView) {
      setTimeout(() => {
        startTutorial(currentView);
      }, 100);
    }
  };

  // Si no hay vista con tutorial, no mostrar el botón
  if (!currentView) {
    return null;
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              disabled={isRunning}
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ayuda y Tutorial</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleStartCurrentTutorial}>
          <HelpCircle className="w-4 h-4 mr-2" />
          <span>Tutorial de {viewNames[currentView]}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleResetAllTutorials}>
          <RotateCcw className="w-4 h-4 mr-2" />
          <span>Reiniciar todos los tutoriales</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
