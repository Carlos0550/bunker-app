import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, 
  ImagePlus, 
  X, 
  ScanLine, 
  FolderPlus, 
  CheckCircle, 
  Loader2 
} from "lucide-react";
import { Product, Category } from "@/api/services/products";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  categories: Category[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  isCreatingNewCategory: boolean;
  setIsCreatingNewCategory: (creating: boolean) => void;
  newCategoryInline: string;
  setNewCategoryInline: (name: string) => void;
  scannedBarcode: string;
  setScannedBarcode: (code: string) => void;
  selectedImage: File | null;
  setSelectedImage: (file: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  onOpenScanner: () => void;
  onCreateCategory: (name: string) => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isCreatingCategory: boolean;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  editingProduct,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  isCreatingNewCategory,
  setIsCreatingNewCategory,
  newCategoryInline,
  setNewCategoryInline,
  scannedBarcode,
  setScannedBarcode,
  selectedImage,
  setSelectedImage,
  imagePreview,
  setImagePreview,
  onOpenScanner,
  onCreateCategory,
  onSave,
  isLoading,
  isCreatingCategory,
}: ProductFormDialogProps) {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {}
            <div className="col-span-2">
              <Label>Imagen del producto</Label>
              <div className="flex items-center gap-4 mt-2">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center overflow-hidden">
                  {imagePreview || editingProduct?.imageUrl ? (
                    <img
                      src={imagePreview || editingProduct?.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="product-image"
                    onChange={handleImageChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("product-image")?.click()}
                  >
                    <ImagePlus className="w-4 h-4 mr-2" />
                    {imagePreview || editingProduct?.imageUrl ? "Cambiar imagen" : "Subir imagen"}
                  </Button>
                  {(imagePreview || selectedImage) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-destructive"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG o WebP (máx. 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingProduct?.name}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={editingProduct?.sku || ""}
              />
            </div>
            
            <div>
              <Label htmlFor="barcode">Código de Barras</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  name="barcode"
                  value={scannedBarcode}
                  onChange={(e) => setScannedBarcode(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onOpenScanner}
                  title="Escanear código de barras"
                >
                  <ScanLine className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Categoría</Label>
              {isCreatingNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryInline}
                    onChange={(e) => setNewCategoryInline(e.target.value)}
                    placeholder="Nombre de la nueva categoría"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (newCategoryInline.trim()) {
                        onCreateCategory(newCategoryInline.trim());
                      }
                    }}
                    disabled={!newCategoryInline.trim() || isCreatingCategory}
                  >
                    {isCreatingCategory ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreatingNewCategory(false);
                      setNewCategoryInline("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Select 
                  value={selectedCategoryId || editingProduct?.categoryId || ""}
                  onValueChange={(value) => {
                    if (value === "__new__") {
                      setIsCreatingNewCategory(true);
                    } else {
                      setSelectedCategoryId(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__" className="text-primary">
                      <div className="flex items-center gap-2">
                        <FolderPlus className="w-4 h-4" />
                        <span>+ Crear nueva categoría</span>
                      </div>
                    </SelectItem>
                    {categories.length > 0 && (
                      <div className="border-t my-1" />
                    )}
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <input 
                type="hidden" 
                name="category" 
                value={selectedCategoryId || editingProduct?.categoryId || ""} 
              />
            </div>
            
            <div>
              <Label htmlFor="price">Precio de Venta</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                defaultValue={editingProduct?.sale_price || ""}
              />
            </div>
            
            <div>
              <Label htmlFor="cost">Costo</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                defaultValue={editingProduct?.cost_price || ""}
              />
            </div>
            
            <div>
              <Label htmlFor="stock">Stock Inicial</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                defaultValue={editingProduct?.stock || 0}
                disabled={!!editingProduct}
              />
            </div>
            
            <div>
              <Label htmlFor="minStock">Stock Mínimo</Label>
              <Input
                id="minStock"
                name="minStock"
                type="number"
                defaultValue={editingProduct?.min_stock || 5}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingProduct?.description || ""}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingProduct ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
