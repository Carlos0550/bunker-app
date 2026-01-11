import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { authApi } from "@/api/services/auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verificando tu correo electrónico...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado.");
      return;
    }

    const verify = async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus("success");
        setMessage("¡Correo verificado exitosamente!");
      } catch (error: any) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Error al verificar el correo.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center">
            {status === "loading" && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
            {status === "success" && <CheckCircle2 className="w-10 h-10 text-success" />}
            {status === "error" && <XCircle className="w-10 h-10 text-destructive" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Verificando..."}
            {status === "success" && "¡Verificación Exitosa!"}
            {status === "error" && "Error de Verificación"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            {message}
          </p>

          <div className="pt-2">
            {status === "success" ? (
              <Button 
                onClick={() => navigate("/login")} 
                className="w-full bg-primary hover:bg-primary/90"
              >
                Iniciar Sesión
              </Button>
            ) : status === "error" ? (
              <Button 
                onClick={() => navigate("/")} 
                variant="outline"
                className="w-full"
              >
                Volver al Inicio
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
