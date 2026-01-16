import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessApi, Multiplier } from "@/api/services/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Percent, Plus, Pencil, Trash2, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "CARD", label: "Tarjeta" },
  { value: "TRANSFER", label: "Transferencia" },
];

const INSTALLMENT_OPTIONS = [
  { value: "any", label: "Cualquiera" },
  { value: "1", label: "1 pago" },
  { value: "2", label: "2 cuotas" },
  { value: "3", label: "3 cuotas" },
  { value: "6", label: "6 cuotas" },
  { value: "+1", label: "En cuotas (>1)" },
];

export function MultipliersConfig() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingMultiplier, setEditingMultiplier] = useState<Multiplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    value: "",
    paymentMethods: [] as string[],
    isActive: true,
    installmentsCondition: "any",
  });

  // Query para obtener multiplicadores
  const { data: multipliers = [], isLoading } = useQuery({
    queryKey: ["business", "multipliers"],
    queryFn: businessApi.getMultipliers,
  });

  // Mutation para actualizar multiplicadores
  const updateMutation = useMutation({
    mutationFn: businessApi.updateMultipliers,
    onSuccess: () => {
      toast.success("Multiplicadores actualizados");
      queryClient.invalidateQueries({ queryKey: ["business", "multipliers"] });
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al actualizar");
    },
  });

  const closeDialog = () => {
    setShowDialog(false);
    setEditingMultiplier(null);
    setFormData({ name: "", value: "", paymentMethods: [], isActive: true, installmentsCondition: "any" });
  };

  const handleEdit = (multiplier: Multiplier) => {
    setEditingMultiplier(multiplier);
    setFormData({
      name: multiplier.name,
      value: String(multiplier.value * 100), // Convert 0.16 to 16
      paymentMethods: multiplier.paymentMethods,
      isActive: multiplier.isActive,
      installmentsCondition: multiplier.installmentsCondition || "any",
    });
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este multiplicador?")) return;
    const updated = multipliers.filter((m) => m.id !== id);
    updateMutation.mutate(updated);
  };

  const toggleActive = (multiplier: Multiplier) => {
    const  updated = multipliers.map((m) =>
      m.id === multiplier.id ? { ...m, isActive: !m.isActive } : m
    );
    updateMutation.mutate(updated);
  };

  const handleSave = () => {
    if (!formData.name || !formData.value || formData.paymentMethods.length === 0) {
      toast.error("Complete todos los campos");
      return;
    }

    const value = parseFloat(formData.value) / 100; // Convert 16 to 0.16

    if (isNaN(value) || value <= 0) {
      toast.error("Valor inválido");
      return;
    }

    let updated: Multiplier[];

    if (editingMultiplier) {
      // Edit existing
      updated = multipliers.map((m) =>
        m.id === editingMultiplier.id
          ? {
              ...m,
              name: formData.name,
              value,
              paymentMethods: formData.paymentMethods,
              isActive: formData.isActive,
              installmentsCondition:
                formData.installmentsCondition === "any"
                  ? undefined
                  : formData.installmentsCondition,
            }
          : m
      );
    } else {
      // Add new
      const newMultiplier: Multiplier = {
        id: crypto.randomUUID(),
        name: formData.name,
        value,
        paymentMethods: formData.paymentMethods,
        isActive: formData.isActive,
        installmentsCondition:
          formData.installmentsCondition === "any"
            ? undefined
            : formData.installmentsCondition,
      };
      updated = [...multipliers, newMultiplier];
    }

    updateMutation.mutate(updated);
  };

  const togglePaymentMethod = (method: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter((m) => m !== method)
        : [...prev.paymentMethods, method],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Multiplicadores de Precio
            </CardTitle>
            <CardDescription>
              Configurar multiplicadores como IVA, comisiones bancarias, etc. según método de pago
            </CardDescription>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bunker-glow">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Multiplicador
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : multipliers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Percent className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay multiplicadores configurados</p>
            <p className="text-sm mt-2">Agrega multiplicadores para aplicar cargos dinámicos según el método de pago</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Métodos de Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {multipliers.map((multiplier) => (
                <TableRow key={multiplier.id}>
                  <TableCell className="font-medium">{multiplier.name}</TableCell>
                  <TableCell>{(multiplier.value * 100).toFixed(2)}%</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {multiplier.paymentMethods.map((method) => (
                        <Badge key={method} variant="outline" className="text-xs">
                          {PAYMENT_METHODS.find((pm) => pm.value === method)?.label}
                        </Badge>
                      ))}
                    </div>
                    {multiplier.installmentsCondition &&
                      multiplier.paymentMethods.includes("CARD") && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            Condición:{" "}
                            {INSTALLMENT_OPTIONS.find(
                              (o) => o.value === multiplier.installmentsCondition
                            )?.label || multiplier.installmentsCondition}
                          </Badge>
                        </div>
                      )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={multiplier.isActive ? "default" : "secondary"}>
                      {multiplier.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleActive(multiplier)}
                        title={multiplier.isActive ? "Desactivar" : "Activar"}
                      >
                        {multiplier.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(multiplier)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(multiplier.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Dialog para agregar/editar */}
      <Dialog open={showDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMultiplier ? "Editar" : "Nuevo"} Multiplicador</DialogTitle>
            <DialogDescription>
              {editingMultiplier
                ? "Modifica los detalles del multiplicador"
                : "Agrega un nuevo multiplicador de precio"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Ej: IVA, Comisión Tarjeta, etc."
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="value">Valor (%)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder="Ej: 16 para 16%"
                value={formData.value}
                onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ejemplo: 16 para 16%, 3.5 para 3.5%
              </p>
            </div>

            <div>
              <Label>Métodos de Pago</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Selecciona los métodos de pago donde se aplicará este multiplicador
              </p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => (
                  <div key={method.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`method-${method.value}`}
                      checked={formData.paymentMethods.includes(method.value)}
                      onCheckedChange={() => togglePaymentMethod(method.value)}
                    />
                    <label
                      htmlFor={`method-${method.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {method.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {formData.paymentMethods.includes("CARD") && (
              <div>
                <Label>Condición de Cuotas (Tarjeta)</Label>
                <Select
                  value={formData.installmentsCondition}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, installmentsCondition: value }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar condición" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTALLMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Define cuándo se aplica este multiplicador en pagos con tarjeta
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: !!checked }))
                }
              />
              <label htmlFor="isActive" className="text-sm cursor-pointer">
                Activar inmediatamente
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingMultiplier ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
