import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Eye, EyeOff, Loader2, Building2, User } from "lucide-react";
import { authApi } from "@/api/services/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.register(formData);
      
      toast({
        title: "¡Registro exitoso!",
        description: `Bienvenido ${response.user.name}. Tu negocio ${formData.businessName} ha sido creado.`,
      });
      navigate("/login");
      
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: error.response?.data?.message || error.message || "Ocurrió un error al registrarse",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (Igual que Login) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">BUNKER</span>
              <span className="text-2xl font-light text-primary">APP</span>
            </div>
          </div>

          {/* Center Content */}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight">
              Comienza tu
              <span className="block text-primary">Prueba Gratuita</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Únete a miles de negocios que ya gestionan su inventario de forma inteligente.
              7 días gratis, sin compromiso.
            </p>
          </div>

          {/* Footer */}
          <p className="text-sm text-muted-foreground">
            © 2024 Bunker App. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">BUNKER</span>
              <span className="text-xl font-light text-primary">APP</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">Crea tu cuenta</h2>
            <p className="mt-2 text-muted-foreground">
              Configura tu negocio y comienza a operar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-6">
            
            {/* Sección: Datos del Negocio */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                <Building2 className="w-5 h-5" />
                <h3>Datos del Negocio</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nombre del Negocio *</Label>
                  <Input 
                    id="businessName" 
                    placeholder="Mi Tienda S.A." 
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Dirección *</Label>
                  <Input 
                    id="businessAddress" 
                    placeholder="Av. Principal 123" 
                    value={formData.businessAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Teléfono (opcional)</Label>
                    <Input 
                      id="businessPhone" 
                      placeholder="+52 555..." 
                      value={formData.businessPhone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Email de Contacto (opcional)</Label>
                    <Input 
                      id="businessEmail" 
                      type="email"
                      placeholder="contacto@negocio.com" 
                      value={formData.businessEmail}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Datos del Administrador */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                <User className="w-5 h-5" />
                <h3>Datos del Administrador</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input 
                  id="name" 
                  placeholder="Juan Pérez" 
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico (Login) *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@bunker.com" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={handleChange}
                    className="pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-base font-medium mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Crear Cuenta y Comenzar Prueba"
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
              <a href="/login" className="font-medium text-primary hover:underline">
                Inicia sesión aquí
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
