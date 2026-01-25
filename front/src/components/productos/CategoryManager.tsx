import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Tag, Edit2, Trash2, Loader2 } from "lucide-react";
import { Category, Product } from "@/api/services/products";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared";

interface CategoryManagerProps {
  categories: Category[];
  products: Product[];
  onCreateCategory: (name: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function CategoryManager({
  categories,
  products,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  isCreating,
  isUpdating,
  isDeleting,
}: CategoryManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const getProductCount = (categoryId: string) => {
    return products.filter((p) => p.categoryId === categoryId).length;
  };

  const handleSave = () => {
    if (!categoryName.trim()) {
      toast.error("El nombre de la categoría es requerido");
      return;
    }

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, categoryName.trim());
    } else {
      onCreateCategory(categoryName.trim());
    }
    
    setDialogOpen(false);
    setEditingCategory(null);
    setCategoryName("");
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCategoryName("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    const productCount = getProductCount(category.id);
    if (productCount > 0) {
      toast.error(`No se puede eliminar "${category.name}" porque tiene ${productCount} producto(s) asociado(s)`);
      return;
    }
    if (confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      onDeleteCategory(category.id);
    }
  };

  return (
    <div className="space-y-4">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Categorías</h3>
          <p className="text-sm text-muted-foreground">
            Organiza tus productos en categorías
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {}
      {categories.length === 0 ? (
        <div className="bunker-card p-12">
          <EmptyState
            icon={Tag}
            title="Sin categorías"
            description="Crea categorías para organizar mejor tus productos"
            action={
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primera categoría
              </Button>
            }
          />
        </div>
      ) : (
        <div className="bunker-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Nombre</TableHead>
                  <TableHead className="text-muted-foreground text-center">Productos</TableHead>
                  <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const productCount = getProductCount(category.id);
                  return (
                    <TableRow key={category.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Tag className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${productCount > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                          {productCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(category)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(category)}
                            disabled={productCount > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingCategory(null);
          setCategoryName("");
        }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? "Modifica el nombre de la categoría"
                : "Crea una nueva categoría para organizar tus productos"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nombre de la categoría</Label>
              <Input
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ej: Bebidas, Lácteos, Limpieza..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!categoryName.trim() || isCreating || isUpdating}
            >
              {(isCreating || isUpdating) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
