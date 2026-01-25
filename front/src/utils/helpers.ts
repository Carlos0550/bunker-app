import { toast } from "sonner";
import { AxiosError } from "axios";

export const handleApiError = (error: unknown, defaultMessage: string = "Ha ocurrido un error") => {
  console.error(error);
  if (error instanceof AxiosError) {
    const message = error.response?.data?.error?.message || error.response?.data?.message || defaultMessage;
    toast.error(message);
    return;
  }
  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }
  toast.error(defaultMessage);
};

export const formatCurrency = (value: number, compact: boolean = false) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);
};
