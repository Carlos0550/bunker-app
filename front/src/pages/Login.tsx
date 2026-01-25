import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/api/services/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const login = useAuthStore((state) => state.login);
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  
  const from = location.state?.from?.pathname || "/dashboard";

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authApi.recoverPassword(email);
      
      toast({
        title: "Correo enviado",
        description: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña.",
      });
      
      setIsRecovering(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error?.message || error.message || "Error al enviar el correo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });
      
      login(response.token, response.user);
      
      toast({
        title: "¡Bienvenido de nuevo!",
        description: `Has iniciado sesión como ${response.user.name}`,
      });

      navigate(from, { replace: true });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: error.response?.data?.error?.message || error.message || "Credenciales inválidas",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        
        {}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">BUNKER</span>
              <span className="text-2xl font-light text-primary">APP</span>
            </div>
          </div>

          {}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight">
              Sistema Integral de
              <span className="block text-primary">Gestión y Control</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Administra tu inventario, ventas y clientes desde una plataforma unificada, 
              segura y eficiente.
            </p>
            
            {}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { label: "Control de Stock", value: "Tiempo Real" },
                { label: "Punto de Venta", value: "Integrado" },
                { label: "Reportes", value: "Avanzados" },
                { label: "Multi-usuario", value: "Roles" }
              ].map((feature) => (
                <div key={feature.label} className="p-4 rounded-lg bg-card/50 border border-border">
                  <p className="text-xs text-muted-foreground">{feature.label}</p>
                  <p className="text-sm font-semibold text-foreground">{feature.value}</p>
                </div>
              ))}
            </div>
          </div>

          {}
          <p className="text-sm text-muted-foreground">
            © 2024 Bunker App. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">BUNKER</span>
              <span className="text-xl font-light text-primary">APP</span>
            </div>
          </div>

          {}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">
              {isRecovering ? "Recuperar Contraseña" : "Bienvenido"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isRecovering 
                ? "Ingresa tu correo para recibir instrucciones" 
                : "Ingresa tus credenciales para acceder al sistema"}
            </p>
          </div>

          {}
          <form onSubmit={isRecovering ? handleRecoverPassword : handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@bunker.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              {!isRecovering && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <button 
                      type="button"
                      onClick={() => setIsRecovering(true)}
                      className="text-sm font-medium text-primary hover:text-primary/80"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-base font-medium transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  isRecovering ? "Enviar Instrucciones" : "Iniciar Sesión"
                )}
              </Button>

              {isRecovering && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsRecovering(false)}
                  disabled={isLoading}
                >
                  Volver al inicio de sesión
                </Button>
              )}
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">¿No tienes cuenta? </span>
              <a href="/register" className="font-medium text-primary hover:underline">
                Regístrate y prueba gratis
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
