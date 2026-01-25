import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  usersApi,
  User,
  CreateUserData,
  UpdateUserData,
} from "@/api/services/users";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";


export function useUsers() {
  const { user } = useAuthStore();
  const businessId = user?.businessId || "";

  return useQuery({
    queryKey: ["users", businessId],
    queryFn: () => usersApi.getUsersByBusiness(businessId),
    enabled: !!businessId,
  });
}


export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserData) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(
        "Usuario creado. Se envió la contraseña temporal por correo.",
      );
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al crear usuario",
      );
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al actualizar usuario",
      );
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Error al eliminar usuario",
      );
    },
  });
}
