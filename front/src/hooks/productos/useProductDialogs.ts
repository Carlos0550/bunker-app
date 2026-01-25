import { useState } from "react";
import { Product } from "@/api/services/products";
import { ManualProduct } from "@/api/services/sales";

export const useProductDialogs = () => {
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryInline, setNewCategoryInline] = useState("");

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setScannedBarcode("");
    setSelectedCategoryId("");
    setSelectedImage(null);
    setImagePreview(null);
    setIsCreatingNewCategory(false);
    setNewCategoryInline("");
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setScannedBarcode(product.bar_code || "");
    setSelectedCategoryId(product.categoryId || "");
    setSelectedImage(null);
    setImagePreview(product.imageUrl || null);
    setIsCreatingNewCategory(false);
    setNewCategoryInline("");
    setIsDialogOpen(true);
  };

  
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [stockOperation, setStockOperation] = useState<"add" | "subtract" | "set">("add");

  const handleAdjustStock = (product: Product) => {
    setStockProduct(product);
    setStockQuantity(0);
    setStockOperation("add");
    setIsStockDialogOpen(true);
  };

  
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedManualProduct, setSelectedManualProduct] = useState<ManualProduct | null>(null);
  const [selectedLinkProductId, setSelectedLinkProductId] = useState("");
  const [linkProductSearch, setLinkProductSearch] = useState("");

  const handleLinkManualProduct = (mp: ManualProduct) => {
      setSelectedManualProduct(mp);
      setLinkDialogOpen(true);
  }

  
  const [editManualDialogOpen, setEditManualDialogOpen] = useState(false);
  const [editManualForm, setEditManualForm] = useState({ name: "", quantity: 1, price: 0 });

  return {
    isDialogOpen, setIsDialogOpen,
    editingProduct, setEditingProduct,
    scannedBarcode, setScannedBarcode,
    selectedCategoryId, setSelectedCategoryId,
    selectedImage, setSelectedImage,
    imagePreview, setImagePreview,
    isCreatingNewCategory, setIsCreatingNewCategory,
    newCategoryInline, setNewCategoryInline,
    handleOpenNewProduct,
    handleEditProduct,
    
    isStockDialogOpen, setIsStockDialogOpen,
    stockProduct, setStockProduct,
    stockQuantity, setStockQuantity,
    stockOperation, setStockOperation,
    handleAdjustStock,

    linkDialogOpen, setLinkDialogOpen,
    selectedManualProduct, setSelectedManualProduct,
    selectedLinkProductId, setSelectedLinkProductId,
    linkProductSearch, setLinkProductSearch,
    handleLinkManualProduct,

    editManualDialogOpen, setEditManualDialogOpen,
    editManualForm, setEditManualForm
  };
};
