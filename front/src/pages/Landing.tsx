import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Shield, 
  Zap,
  Check,
  ArrowRight,
  Star,
  Play,
  Smartphone,
  Cloud,
  Clock,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: ShoppingCart,
      title: "Punto de Venta Intuitivo",
      description: "Interfaz rápida y fácil de usar. Procesa ventas en segundos con búsqueda inteligente y atajos de teclado."
    },
    {
      icon: Package,
      title: "Control de Inventario",
      description: "Monitorea tu stock en tiempo real. Alertas automáticas de bajo inventario y trazabilidad completa."
    },
    {
      icon: Users,
      title: "Gestión de Clientes",
      description: "Base de datos centralizada con historial de compras, ventas a crédito  (cuentas corrientes) y análisis de comportamiento."
    },
    {
      icon: BarChart3,
      title: "Reportes Avanzados",
      description: "Dashboards interactivos con métricas clave. Tomá decisiones basadas en datos reales."
    },
    {
      icon: Shield,
      title: "Seguridad Empresarial",
      description: "Roles y permisos personalizables. Auditoría completa de todas las operaciones."
    }
  ];


  const plans = [
    {
      name: "Plan Estándar",
      price: "$30.000/mes",
      description: "Todo lo que necesitas para hacer crecer tu negocio. Prueba gratis por 7 días.",
      popular: true,
      trialBadge: true,
      features: [
        "Puntos de venta ilimitados",
        "Hasta 25,000 productos en inventario",
        "Reportes avanzados con analíticas detalladas",
        "Dashboard con métricas en tiempo real",
        "Clientes ilimitados con cuentas corrientes",
        "Ventas ilimitadas al mes",
        "Hasta 10 administradores/usuarios",
        "Gestión completa de clientes y proveedores",
        "Búsqueda de productos por nombre, SKU o código de barras",
        "Control de stock con alertas de bajo inventario",
        "Historial completo de transacciones y movimientos",
        "Exportación de datos a Excel/CSV",
        "Importación masiva ilimitada de productos en cualquier de los formatos soportados (csv, xlsx, xls)",
        "Analíticas avanzadas: productos más vendidos, tendencias, comparativas",
        "Gestión avanzada de categorías y proveedores",
        "Reportes personalizados por fechas y filtros",
        "Soporte prioritario 24/7 por email y chat",
        "Acceso anticipado a nuevas funcionalidades",
        "Funciones especiales con IA (Próximamente)",
        "Recordatorios automáticos de pagos pendientes a tus clientes"
      ]
    }
  ];

  
  return (
    <div className="min-h-screen bg-background">
      {}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Bunker</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Características
            </a>
            {

}
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Precios
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Iniciar Sesión</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Prueba Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto relative">
          <div className="max-w-4xl mx-auto text-center">
            {

}
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              El Sistema POS que tu
              <span className="text-primary"> Negocio Necesita</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Controla ventas, inventario y clientes desde una sola plataforma. 
              Bunker te da el poder de tomar decisiones inteligentes con datos en tiempo real.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-14">
                  Comienza Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                <Play className="w-5 h-5 mr-2" />
                Ver Demo
              </Button>
            </div>

            {}
            {


}
          </div>
        </div>
      </section>

      {}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">Características</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas para gestionar tu negocio
            </h2>
            <p className="text-muted-foreground">
              Herramientas poderosas diseñadas para simplificar tus operaciones diarias
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">¿Por qué Bunker?</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Impulsa tu negocio con tecnología de punta
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <Cloud className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">100% en la Nube</h4>
                    <p className="text-sm text-muted-foreground">
                      Accede desde cualquier dispositivo. Sin instalaciones complicadas.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Funciona Offline</h4>
                    <p className="text-sm text-muted-foreground">
                      Continúa vendiendo aunque no tengas internet. Se sincroniza automáticamente.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Configuración en Minutos</h4>
                    <p className="text-sm text-muted-foreground">
                      Empieza a vender en menos de 10 minutos. Importa tu inventario fácilmente.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Escala sin Límites</h4>
                    <p className="text-sm text-muted-foreground">
                      Desde una tienda hasta cadenas nacionales. Bunker crece contigo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-2xl border border-border overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
                <div className="absolute inset-4 bg-background/80 rounded-xl border border-border/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-primary/30 transition-colors">
                      <Play className="w-8 h-8 text-primary ml-1" />
                    </div>
                    <p className="text-sm text-muted-foreground">Ver video demo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {


}

      {}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">Precios</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Un plan completo para tu negocio
            </h2>
            <p className="text-muted-foreground mb-4">
              Sin compromisos. Cancela cuando quieras.
            </p>
            <Badge className="bg-success/20 text-success border-success/30 mb-4">
              ✨ Prueba gratis por 7 días - Sin tarjeta de crédito
            </Badge>
          </div>

          <div className="flex justify-center max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative w-full ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border/50'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Más Popular</Badge>
                  </div>
                )}
                {plan.trialBadge && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-success/20 text-success border-success/30">
                      7 días gratis
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-2 mb-4">
                      <span className="text-5xl font-bold">{plan.price}</span>
                    </div>
                    {plan.trialBadge && (
                      <p className="text-sm text-success font-medium">
                        Prueba gratis por 7 días • Sin tarjeta de crédito
                      </p>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mb-8 grid md:grid-cols-2 gap-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/register">
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                    >
                      Comenzar Prueba Gratis
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    No se requiere tarjeta de crédito • Cancela cuando quieras
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/20 p-12 md:p-16">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Listo para transformar tu negocio?
              </h2>
              <p className="text-muted-foreground mb-8">
                Únete a más de 2,500 negocios que ya optimizaron sus operaciones con Bunker. 
                Comienza tu prueba gratuita de 7 días hoy.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-14">
                    Empezar Prueba Gratis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                  Hablar con Ventas
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                No se requiere tarjeta de crédito • Configuración en minutos
              </p>
            </div>
          </div>
        </div>
      </section>

      {}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">Bunker</span>
              </div>
              <p className="text-sm text-muted-foreground">
                El sistema POS más completo para hacer crecer tu negocio.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Características</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Precios</a></li>
                {
}
              </ul>
            </div>
            
            {


}
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Términos</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Bunker. Todos los derechos reservados.
            </p>
            {


}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;