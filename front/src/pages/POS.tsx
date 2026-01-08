import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { mockProducts, mockCustomers } from "@/data/mockData";
import { Product } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Building2,
  User,
  ShoppingCart,
  Percent,
  Receipt
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function POS() {
  const [searchTerm, setSearchTerm] = useState("");
  const { items: cart, addItem, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");

  const filteredProducts = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm)
  );

  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) {
      toast.error("Producto sin stock disponible");
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error("Stock insuficiente");
        return;
      }
    }

    addItem(product);
    toast.success(`${product.name} agregado`);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) return;

    const product = mockProducts.find((p) => p.id === productId);
    if (product && newQty > product.stock) {
      toast.error("Stock insuficiente");
      return;
    }

    updateQuantity(productId, newQty);
  };

  const subtotal = getTotal();
  const discountAmount = (subtotal * discount) / 100;
  const tax = (subtotal - discountAmount) * 0.16;
  const total = subtotal - discountAmount + tax;

  const processSale = () => {
    if (cart.length === 0) {
      toast.error("Agrega productos al carrito");
      return;
    }
    toast.success("¡Venta procesada exitosamente!", {
      description: `Total: $${total.toFixed(2)}`,
    });
    clearCart();
    setDiscount(0);
    setSelectedCustomer("");
  };

  return (
    <MainLayout title="Punto de Venta">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Products Section */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, SKU o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-card border-border text-lg"
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-auto scrollbar-thin">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className="bunker-card p-4 text-left transition-all hover:border-primary/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="aspect-square rounded-lg bg-secondary/50 mb-3 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">{product.sku}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                    <Badge
                      variant={product.stock <= product.minStock ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      Stock: {product.stock}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="bunker-card flex flex-col h-full">
          {/* Cart Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrito
              </h2>
              <Badge variant="outline">{cart.length} items</Badge>
            </div>

            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-full bg-secondary/50">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Cliente General</SelectItem>
                {mockCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
                <p>Carrito vacío</p>
                <p className="text-sm">Agrega productos para comenzar</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${item.price.toFixed(2)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-bold text-foreground w-20 text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-4 border-t border-border space-y-4">
            {/* Discount */}
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Descuento %"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="flex-1 h-9 bg-secondary/50"
                min={0}
                max={100}
              />
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Descuento ({discount}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>IVA (16%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "cash", icon: Banknote, label: "Efectivo" },
                { value: "card", icon: CreditCard, label: "Tarjeta" },
                { value: "transfer", icon: Building2, label: "Transfer" },
              ].map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  variant={paymentMethod === value ? "default" : "secondary"}
                  className="flex-col h-auto py-3 gap-1"
                  onClick={() => setPaymentMethod(value as typeof paymentMethod)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>

            {/* Process Sale */}
            <Button
              className="w-full h-12 text-lg font-semibold bunker-glow"
              onClick={processSale}
              disabled={cart.length === 0}
            >
              <Receipt className="w-5 h-5 mr-2" />
              Procesar Venta
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
