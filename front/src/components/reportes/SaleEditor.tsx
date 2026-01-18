import React, { useState } from "react";
import { Sale, CreateSaleData } from "@/api/services/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  X,
  Trash2,
  CreditCard,
  Wallet,
  Info,
  ShoppingCart,
  Receipt,
  Minus,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessApi, Multiplier } from "@/api/services/business";
import { productsApi, Product } from "@/api/services/products";
import { Search, Loader2, PlusCircle, Package } from "lucide-react";

interface SaleEditorProps {
  sale: Sale;
  onSave: (data: Partial<CreateSaleData>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function SaleEditor({ sale, onSave, onCancel, isLoading }: SaleEditorProps) {
  const [items, setItems] = useState(
    sale.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      isManual: item.isManual,
    }))
  );
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod);
  const [notes, setNotes] = useState(sale.notes || "");
  const [discountType, setDiscountType] = useState(sale.discountType);
  const [discountValue, setDiscountValue] = useState(sale.discountValue || 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { user } = useAuthStore();
  const businessId = user?.businessId;

  // Multipliers query
  const { data: multipliers = [] } = useQuery({
    queryKey: ["business", "multipliers", businessId],
    queryFn: businessApi.getMultipliers,
    staleTime: 60000,
    enabled: !!businessId,
  });

  // Products Search Query
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["posProducts", searchTerm],
    queryFn: () => productsApi.getProducts({ search: searchTerm }, { page: 1, limit: 10 }),
    enabled: searchTerm.length >= 2,
  });

  const searchResults = productsData?.data || [];

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === "quantity") {
      (newItems[index] as any)[field] = Math.max(0, value);
    } else {
      (newItems[index] as any)[field] = value;
    }
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddProduct = (product: Product) => {
    // Check if product already in items
    const existingIndex = items.findIndex(item => item.productId === product.id);
    if (existingIndex !== -1) {
      handleUpdateItem(existingIndex, "quantity", items[existingIndex].quantity + 1);
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: 1,
          unitPrice: product.sale_price || 0,
          isManual: false,
        },
      ]);
    }
    setSearchTerm("");
    setIsSearching(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      items,
      paymentMethod: paymentMethod as any,
      notes,
      discountType: discountType as any,
      discountValue: Number(discountValue),
      taxRate: 0,
      total,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  };

  const subtotal = calculateSubtotal();
  let discountAmount = 0;
  
  if (discountType === "PERCENTAGE") {
    discountAmount = subtotal * (discountValue / 100);
  } else if (discountType === "FIXED") {
    discountAmount = discountValue;
  }

  const baseForMultipliers = subtotal - discountAmount;

  // Multipliers logic (similar to POS.tsx)
  const activeMultipliers = multipliers.filter((m: Multiplier) => {
    if (!m.isActive) return false;
    return m.paymentMethods.includes(paymentMethod);
  });

  const multipliersTotal = activeMultipliers.reduce(
    (acc: number, m: Multiplier) => acc + baseForMultipliers * m.value,
    0
  );

  const total = baseForMultipliers + multipliersTotal;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Configuration Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/50 backdrop-blur-sm">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Wallet className="w-3 h-3" />
            Método de Pago
          </Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="bg-background/50 border-border/50 focus:ring-primary h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Efectivo</SelectItem>
              <SelectItem value="CARD">Tarjeta</SelectItem>
              <SelectItem value="TRANSFER">Transferencia</SelectItem>
              <SelectItem value="OTHER">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            Descuento
          </Label>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <Select value={discountType || "NONE"} onValueChange={(v) => setDiscountType(v === "NONE" ? null : v as any)}>
              <SelectTrigger className="bg-background/50 border-border/50 focus:ring-primary h-11 w-full sm:w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin desc.</SelectItem>
                <SelectItem value="PERCENTAGE">%</SelectItem>
                <SelectItem value="FIXED">$</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              disabled={!discountType}
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              className="bg-background/50 border-border/50 focus:ring-primary h-11 flex-1 min-w-[100px]"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ShoppingCart className="w-3 h-3" />
            Productos de la Venta
          </Label>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isLoadingProducts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </div>
          <Input
            placeholder="Buscar producto para añadir..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.length >= 2) setIsSearching(true);
            }}
            onFocus={() => {
              if (searchTerm.length >= 2) setIsSearching(true);
            }}
            className="pl-10 h-10 bg-secondary/20 border-border/50 focus:ring-primary"
          />
          
          {isSearching && searchTerm.length >= 2 && (
            <div className="absolute z-50 mt-2 w-full bg-background border border-border shadow-2xl rounded-xl overflow-hidden max-h-[300px] overflow-y-auto backdrop-blur-md">
              <div className="p-2 bg-secondary/30 border-b border-border flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase px-2">Resultados</span>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setIsSearching(false)}>
                  <X className="h-3 h-3" />
                </Button>
              </div>
              {searchResults.length === 0 && !isLoadingProducts ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No se encontraron productos
                </div>
              ) : (
                <div className="py-2">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors border-b last:border-0 border-border/50 group"
                      onClick={() => handleAddProduct(product)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku || 'Sin SKU'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">${(product.sale_price || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Stock: {product.stock}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-border">
          {items.map((item, index) => (
            <div 
              key={index} 
              className="group relative p-3 sm:p-4 rounded-xl bg-background/40 border border-border/50 hover:border-primary/30 hover:bg-background/60 transition-all"
            >
              {/* Mobile Remove Button (Top Right) */}
              <button
                type="button"
                className="absolute top-2 right-2 sm:hidden p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                onClick={() => handleRemoveItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                {/* Product Info */}
                <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                  <h4 className="font-bold text-sm text-foreground truncate">{item.productName}</h4>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {item.productSku && (
                      <Badge variant="secondary" className="text-[10px] h-4 font-mono px-1">
                        {item.productSku}
                      </Badge>
                    )}
                    {item.isManual && (
                      <Badge variant="outline" className="text-[10px] h-4 border-warning/30 text-warning px-1">
                        Manual
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Controls Container */}
                <div className="flex flex-wrap items-end sm:items-center gap-3 sm:gap-4 justify-between sm:justify-end w-full sm:w-auto">
                  
                  {/* Quantity Control */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase flex justify-center sm:justify-start">Cant.</span>
                    <div className="flex items-center gap-1 sm:gap-2 bg-secondary/30 rounded-lg p-1 border border-border/50">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md"
                        onClick={() => handleUpdateItem(index, "quantity", Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, "quantity", parseInt(e.target.value) || 0)}
                        className="w-10 text-center bg-transparent border-none text-sm font-bold focus:ring-0 outline-none p-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md"
                        onClick={() => handleUpdateItem(index, "quantity", item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Price Control */}
                  <div className="space-y-1 flex-1 sm:flex-none min-w-[100px]">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase flex justify-end pr-1">Precio Un.</span>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="h-10 w-full sm:w-28 pl-5 text-right font-bold text-sm bg-secondary/30 border-border/50"
                      />
                    </div>
                  </div>

                  {/* Subtotal (Visible on Mobile now too) */}
                  <div className="text-right min-w-[80px] space-y-1 sm:block">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase block">Subtotal</span>
                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </p>
                  </div>

                  {/* Desktop Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden sm:flex h-8 w-8 text-destructive hover:bg-destructive/10 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-border/50 bg-secondary/10">
            <Package className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No hay productos en esta venta</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Utiliza el buscador para añadir ítems</p>
          </div>
        )}
      </div>

      {/* Notes & Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Info className="w-3 h-3" />
            Notas / Observaciones
          </Label>
          <Textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            placeholder="Ej: Se corrigió precio a pedido del cliente..."
            className="min-h-[100px] bg-secondary/20 border-border/50 resize-none focus:ring-primary focus:border-primary"
            rows={3}
          />
        </div>

        <div className="rounded-2xl bg-secondary/30 border border-primary/20 overflow-hidden shadow-lg shadow-black/20">
          <div className="p-4 bg-primary/5 border-b border-primary/10">
            <h5 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Receipt className="w-3 h-3" />
              Resumen de Edición
            </h5>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal Productos</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {activeMultipliers.map((m: Multiplier) => (
              <div key={m.id} className="flex justify-between items-center text-sm text-warning italic">
                <span className="font-medium">{m.name} (+{(m.value * 100).toFixed(1)}%)</span>
                <span className="font-medium">+{formatCurrency(baseForMultipliers * m.value)}</span>
              </div>
            ))}
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-sm text-green-500">
                <span className="font-medium">Descuento ({discountType === "PERCENTAGE" ? `${discountValue}%` : "Fijo"})</span>
                <span className="font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-border/50 flex justify-between items-baseline">
              <span className="text-sm font-bold text-foreground">TOTAL FINAL</span>
              <div className="text-right">
                <span className="text-2xl font-black text-primary drop-shadow-[0_0_15px_rgba(255,200,61,0.3)]">
                  {formatCurrency(total)}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-tighter">
                  Sujeto a confirmación
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row justify-end items-center gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="w-full sm:w-auto h-11 px-6 border-border/50 hover:bg-secondary/50 font-semibold"
        >
          <X className="w-4 h-4 mr-2" />
          Descartar Cambios
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || items.length === 0} 
          className="w-full sm:w-auto h-11 px-8 bg-primary text-secondary font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20 disabled:opacity-50 disabled:scale-100"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-secondary/30 border-t-secondary animate-spin rounded-full mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isLoading ? "Guardando..." : (items.length === 0 ? "Venta sin ítems" : "Confirmar y Guardar")}
        </Button>
      </div>
    </form>
  );
}
