import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/useAuthStore";
import { authApi } from "@/api/services/auth";
import { useToast } from "@/hooks/use-toast";
import { User, Camera } from "lucide-react";

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [previewImage, setPreviewImage] = useState<string | null>(user?.profilePhoto || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  
  useEffect(() => {
    if (open && user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
      setPreviewImage(user.profilePhoto || null);
      setSelectedFile(null);
    }
  }, [user, open]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Por favor selecciona una imagen válida",
          variant: "destructive",
        });
        return;
      }

      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen debe ser menor a 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      
      if (selectedFile) {
        try {
          const result = await authApi.updateProfilePhoto(selectedFile);
          updateUser({ profilePhoto: result.url });
          toast({
            title: "Foto actualizada",
            description: "Tu foto de perfil se ha actualizado correctamente",
          });
        } catch (error) {
          console.error("Error al actualizar foto:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar la foto de perfil",
            variant: "destructive",
          });
        }
      }

      
      if (formData.name !== user.name || formData.email !== user.email) {
        try {
          const updatedUser = await authApi.updateProfile({
            name: formData.name,
            email: formData.email,
          });
          updateUser(updatedUser);
          toast({
            title: "Perfil actualizado",
            description: "Tus datos se han actualizado correctamente",
          });
        } catch (error) {
          console.error("Error al actualizar perfil:", error);
          toast({
            title: "Error",
            description: "No se pudieron actualizar los datos",
            variant: "destructive",
          });
        }
      }

      onOpenChange(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setPreviewImage(user?.profilePhoto || null);
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Actualiza tu información personal y foto de perfil
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-border">
                <AvatarImage src={previewImage || ""} alt={user?.name || "Usuario"} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                  {user?.name ? getInitials(user.name) : <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-lg"
                title="Cambiar foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground text-center">
              Haz clic en la cámara para cambiar tu foto de perfil
            </p>
          </div>

          {}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
