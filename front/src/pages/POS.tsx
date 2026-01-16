import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Product, productsApi } from "@/api/services/products";
import { salesApi, SaleItem as SaleItemType, CreateSaleData } from "@/api/services/sales";
import { customersApi } from "@/api/services/customers";
import { businessApi, Multiplier } from "@/api/services/business";
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
  Receipt,
  Loader2,
  Package,
  AlertCircle,
  FileText,
  UserPlus,
  ScanLine,
} from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CartItem {
  id: string;
  productId?: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  isManual: boolean;
  maxStock?: number; // Stock máximo disponible (solo para productos del inventario)
}

export default function POS() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [installments, setInstallments] = useState(1);
  const [isCredit, setIsCredit] = useState(false);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualHelp, setShowManualHelp] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    phoneOrEmail: "",
    name: "",
    dni: "",
  });
  const manualInputRef = useRef<HTMLInputElement>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  
  // Barcode Scanner Buffer
  const barcodeBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);


  // Queries
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["posProducts", searchTerm],
    queryFn: () =>
      productsApi.getProducts(
        { search: searchTerm || undefined, state: "ACTIVE" },
        { page: 1, limit: 8 }
      ),
    staleTime: 30000,
  });

  // Query para multiplicadores del negocio
  const { data: multipliers = [] } = useQuery({
    queryKey: ["business", "multipliers"],
    queryFn: businessApi.getMultipliers,
    staleTime: 60000,
  });

  // Cargar clientes solo cuando venta a crédito está activa
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["posCustomers"],
    queryFn: () => customersApi.getCustomers({ page: 1, limit: 100 }),
    enabled: isCredit,
    staleTime: 60000,
  });

  const products = productsData?.data || [];
  const customers = customersData?.data || [];

  // Mutation para crear cliente rápido
  const createCustomerMutation = useMutation({
    mutationFn: (data: typeof newCustomerData) => {
      // Usar teléfono/email como identificador principal
      const isEmail = data.phoneOrEmail.includes("@");
      return customersApi.createCustomer({
        identifier: data.phoneOrEmail,
        name: data.name,
        phone: !isEmail ? data.phoneOrEmail : undefined,
        email: isEmail ? data.phoneOrEmail : undefined,
        // El DNI se puede agregar a notas por ahora (encriptado en backend si es necesario)
        notes: data.dni ? `DNI: ${data.dni}` : undefined,
      });
    },
    onSuccess: (result) => {
      toast.success("Cliente creado exitosamente");
      // Usar el customerId (Customer.id), no el BusinessCustomer.id
      setSelectedCustomer(result.customerId);
      setShowNewCustomer(false);
      setNewCustomerData({ phoneOrEmail: "", name: "", dni: "" });
      queryClient.invalidateQueries({ queryKey: ["posCustomers"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al crear cliente");
    },
  });


  // Handlers
  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) {
      toast.error("Producto sin stock disponible");
      return;
    }

    const existingItem = cart.find((item) => item.productId === product.id);
    if (existingItem) {
      if (product.stock !== undefined && existingItem.quantity >= product.stock) {
        toast.error(`Stock máximo alcanzado (${product.stock} disponibles)`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, maxStock: product.stock }
            : item
        )
      );
      toast.success(`+1 ${product.name}`);
    } else {
      setCart([
        ...cart,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          sku: product.sku || undefined,
          price: product.sale_price || 0,
          quantity: 1,
          isManual: false,
          maxStock: product.stock,
        },
      ]);
      toast.success(`${product.name} agregado`);
    }
  };

  // Barcode Scanner Logic
  const processBarcode = async (code: string) => {
    try {
      toast.loading("Buscando producto...", { id: "scan-search" });
      const product = await productsApi.findByBarcode(code);
      toast.dismiss("scan-search");
      
      if (product) {
        handleAddToCart(product);
      } else {
        toast.error(`Producto no encontrado: ${code}`);
      }
    } catch (error) {
      toast.dismiss("scan-search");
      toast.error("Error al buscar el producto");
    }
  };

  // Global Key Listener for Scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input text field
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const currentTime = Date.now();
      
      // If time between keys is too long, reset buffer (it's probably manual typing)
      if (currentTime - lastKeyTime.current > 100) {
        barcodeBuffer.current = "";
      }
      
      lastKeyTime.current = currentTime;

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length > 2) {
          processBarcode(barcodeBuffer.current);
          barcodeBuffer.current = "";
        }
      } else if (e.key.length === 1) {
        // Collect printable characters
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart]); // Dependencia necesaria para que handleAddToCart tenga el carrito actualizado

  const handleManualInput = async () => {
    if (!manualInput.trim()) return;

    // Parsear formato: CANTIDAD NOMBRE PRECIO
    const regex = /^(\d+)\s+(.+?)\s+(\d+(?:\.\d{2})?)$/;
    const match = manualInput.trim().match(regex);

    if (!match) {
      toast.error("Formato inválido. Use: CANTIDAD NOMBRE PRECIO (ej: 2 coca cola 2500)");
      setShowManualHelp(true);
      return;
    }

    const [, quantityStr, name, priceStr] = match;
    const quantity = parseInt(quantityStr, 10);
    const price = parseFloat(priceStr);

    // Agregar al carrito como producto manual
    const manualItem: CartItem = {
      id: crypto.randomUUID(),
      productId: undefined,
      name: name.trim(),
      sku: undefined,
      price,
      quantity,
      isManual: true,
    };

    setCart([...cart, manualItem]);
    
    // Registrar el producto manual en el backend para futura referencia
    try {
      await salesApi.createManualProduct({
        originalText: manualInput.trim(),
        name: name.trim(),
        quantity,
        price,
      });
    } catch (error) {
      console.error("Error al registrar producto manual:", error);
    }

    setManualInput("");
    toast.success(`Producto manual agregado: ${name}`);
    manualInputRef.current?.focus();
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) return;

    // Si no es manual, verificar stock
    if (!item.isManual && item.maxStock !== undefined) {
      if (newQty > item.maxStock) {
        toast.error(`Stock máximo: ${item.maxStock} unidades disponibles`);
        return;
      }
    }

    setCart(
      cart.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(cart.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setSelectedCustomer("");
    setNotes("");
    setIsCredit(false);
  };

  const handleCreditToggle = (checked: boolean) => {
    setIsCredit(checked);
    if (!checked) {
      setSelectedCustomer("");
    }
  };

  const handleCreateQuickCustomer = () => {
    if (!newCustomerData.phoneOrEmail || !newCustomerData.name) {
      toast.error("Teléfono/Email y nombre son requeridos");
      return;
    }
    createCustomerMutation.mutate(newCustomerData);
  };

  // Cálculos
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount =
    discountType === "PERCENTAGE" ? (subtotal * discount) / 100 : discount;
  
  // Calcular multiplicadores activos según método de pago
  const activeMultipliers = multipliers.filter((m: Multiplier) => {
    if (!m.isActive) return false;
    if (!m.paymentMethods.includes(paymentMethod)) return false;

    // Check installments condition for card payments
    if (
      paymentMethod === "CARD" &&
      m.installmentsCondition &&
      m.installmentsCondition !== "any"
    ) {
      if (m.installmentsCondition === "+1") {
        if (installments <= 1) return false;
      } else {
        if (parseInt(m.installmentsCondition) !== installments) return false;
      }
    }

    return true;
  });
  
  const multipliersTotal = activeMultipliers.reduce(
    (acc: number, m: Multiplier) => acc + (subtotal - discountAmount) * m.value,
    0
  );
  
  const total = subtotal - discountAmount + multipliersTotal;

  // Procesar venta
  const processSale = async () => {
    if (cart.length === 0) {
      toast.error("Agrega productos al carrito");
      return;
    }

    if (isCredit && !selectedCustomer) {
      toast.error("Seleccione un cliente para venta a crédito");
      return;
    }

    setIsProcessing(true);

    try {
      const saleItems: SaleItemType[] = cart.map((item) => ({
        productId: item.productId,
        productName: item.name,
        productSku: item.sku,
        quantity: item.quantity,
        unitPrice: item.price,
        isManual: item.isManual,
      }));

      const saleData: CreateSaleData = {
        items: saleItems,
        paymentMethod,
        isCredit,
        customerId: isCredit ? selectedCustomer : undefined,
        discountType: discount > 0 ? discountType : undefined,
        discountValue: discount > 0 ? discount : undefined,
        notes: notes || undefined,
      };

      const sale = await salesApi.createSale(saleData);

      toast.success("¡Venta procesada exitosamente!", {
        description: `${sale.saleNumber} - Total: $${total.toLocaleString()}`,
      });

      clearCart();
      queryClient.invalidateQueries({ queryKey: ["posProducts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Error al procesar la venta"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MainLayout title="Punto de Venta">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-[calc(100vh-8rem)]">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1" data-tour="pos-search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-card border-border text-lg"
              />
            </div>
            <Button
              variant="default"
              className="h-12 px-4"
              onClick={() => setScannerOpen(true)}
              title="Escanear código de barras"
              data-tour="pos-scan"
            >
              <ScanLine className="w-5 h-5 mr-2" />
              Escanear
            </Button>
          </div>

          {/* Manual Input */}
          <div className="bunker-card p-3" data-tour="pos-manual">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Carga Manual</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setShowManualHelp(true)}
              >
                ¿Cómo funciona?
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                ref={manualInputRef}
                placeholder="Ej: 2 coca cola 2500"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualInput()}
                className="flex-1 bg-secondary/50"
              />
              <Button onClick={handleManualInput} disabled={!manualInput.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-auto scrollbar-thin" data-tour="pos-products">
            {loadingProducts ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Package className="w-16 h-16 mb-4 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    className="bunker-card p-4 text-left transition-all hover:border-primary/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="aspect-square rounded-lg bg-secondary/50 mb-3 flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingCart className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {product.sku || "Sin SKU"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ${(product.sale_price || 0).toLocaleString()}
                      </span>
                      <Badge
                        variant={
                          product.stock <= (product.min_stock || 5)
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        Stock: {product.stock}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="bunker-card flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden" data-tour="pos-cart">
          {/* Cart Header */}
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrito
              </h2>
              <Badge variant="outline">{cart.length} items</Badge>
            </div>

            {/* Venta a crédito */}
            <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg" data-tour="pos-credit">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Venta a Crédito (Fiado)</span>
              </div>
              <Switch checked={isCredit} onCheckedChange={handleCreditToggle} />
            </div>

            {/* Selector de cliente - Solo visible cuando isCredit está activo */}
            {isCredit && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="flex-1 bg-secondary/50">
                      <User className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Seleccionar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCustomers ? (
                        <div className="p-2 text-center text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        </div>
                      ) : customers.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground text-sm">
                          No hay clientes registrados
                        </div>
                      ) : (
                        customers.map((bc) => (
                          <SelectItem key={bc.customerId} value={bc.customerId}>
                            {bc.customer.name} - {bc.customer.identifier}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowNewCustomer(true)}
                    title="Crear cliente rápido"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
                {!selectedCustomer && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Debe seleccionar un cliente para venta a crédito
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2 min-h-0">
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
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    item.isManual ? "bg-warning/10 border border-warning/20" : "bg-secondary/30"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      {item.isManual && (
                        <Badge variant="outline" className="text-[10px] border-warning text-warning">
                          Manual
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ${item.price.toLocaleString()} c/u
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
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      disabled={!item.isManual && item.maxStock !== undefined && item.quantity >= item.maxStock}
                      title={!item.isManual && item.maxStock !== undefined && item.quantity >= item.maxStock ? `Máximo ${item.maxStock} unidades` : "Aumentar cantidad"}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-bold text-foreground w-20 text-right">
                    ${(item.price * item.quantity).toLocaleString()}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-4 border-t border-border space-y-4 flex-shrink-0">
            {/* Discount */}
            <div className="flex items-center gap-2" data-tour="pos-discount">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <Select
                value={discountType}
                onValueChange={(v) => setDiscountType(v as any)}
              >
                <SelectTrigger className="w-20 h-9 bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">%</SelectItem>
                  <SelectItem value="FIXED">$</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Descuento"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="flex-1 h-9 bg-secondary/50"
                min={0}
                max={discountType === "PERCENTAGE" ? 100 : subtotal}
              />
            </div>

            {/* Notes */}
            <Textarea
              placeholder="Notas de la venta (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary/50 h-16 resize-none"
            />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>
                    Descuento ({discountType === "PERCENTAGE" ? `${discount}%` : `$${discount}`})
                  </span>
                  <span>-${discountAmount.toLocaleString()}</span>
                </div>
              )}
              {activeMultipliers.map((multiplier: Multiplier) => (
                <div key={multiplier.id} className="flex justify-between text-muted-foreground">
                  <span>{multiplier.name} ({(multiplier.value * 100).toFixed(2)}%)</span>
                  <span>${((subtotal - discountAmount) * multiplier.value).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">${total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method - Solo visible cuando NO es crédito */}
            {!isCredit && (
              <div className="space-y-3" data-tour="pos-payment">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "CASH", icon: Banknote, label: "Efectivo" },
                    { value: "CARD", icon: CreditCard, label: "Tarjeta" },
                    { value: "TRANSFER", icon: Building2, label: "Transfer" },
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={paymentMethod === value ? "default" : "secondary"}
                      className="flex-col h-auto py-3 gap-1"
                      onClick={() => {
                        setPaymentMethod(value as typeof paymentMethod);
                        if (value !== "CARD") setInstallments(1);
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>

                {/* Selector de cuotas */}
                {paymentMethod === "CARD" && (
                  <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-lg border border-border/50">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium whitespace-nowrap">
                      Cuotas:
                    </span>
                    <div className="flex gap-1 flex-1 overflow-x-auto scrollbar-hide">
                      {[1, 2, 3, 6, 12].map((n) => (
                        <Button
                          key={n}
                          size="sm"
                          variant={installments === n ? "default" : "outline"}
                          className="h-7 px-3 text-xs"
                          onClick={() => setInstallments(n)}
                        >
                          {n === 1 ? "1 (Contado)" : n}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Process Sale */}
            <Button
              className="w-full h-12 text-lg font-semibold bunker-glow"
              onClick={processSale}
              disabled={cart.length === 0 || isProcessing || (isCredit && !selectedCustomer)}
              data-tour="pos-process"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Receipt className="w-5 h-5 mr-2" />
              )}
              {isCredit ? "Registrar Fiado" : "Procesar Venta"}
            </Button>
          </div>
        </div>
      </div>

      {/* Manual Input Help Dialog */}
      <Dialog open={showManualHelp} onOpenChange={setShowManualHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Carga Manual de Productos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              La carga manual te permite agregar productos que no están en el sistema
              sin interrumpir la venta.
            </p>
            <div className="bg-secondary/30 p-4 rounded-lg">
              <p className="font-medium mb-2">Formato:</p>
              <code className="text-primary">CANTIDAD NOMBRE PRECIO</code>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted-foreground">Ejemplos:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><code>2 coca cola 2500</code> → 2 unidades a $2500 c/u</li>
                  <li><code>1 pan 500</code> → 1 unidad a $500</li>
                  <li><code>3 leche entera 1800</code> → 3 unidades a $1800 c/u</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Los productos manuales se guardan para que puedas convertirlos en
              productos reales más tarde desde la sección de Productos.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowManualHelp(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Customer Quick Dialog */}
      <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Crear Cliente Rápido
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phoneOrEmail">Teléfono o Email *</Label>
              <Input
                id="phoneOrEmail"
                placeholder="Ej: 3765223959 o cliente@email.com"
                value={newCustomerData.phoneOrEmail}
                onChange={(e) =>
                  setNewCustomerData({ ...newCustomerData, phoneOrEmail: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este será el identificador principal del cliente
              </p>
            </div>
            <div>
              <Label htmlFor="customerName">Nombre *</Label>
              <Input
                id="customerName"
                placeholder="Nombre completo del cliente"
                value={newCustomerData.name}
                onChange={(e) =>
                  setNewCustomerData({ ...newCustomerData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="dni">DNI / Cédula (opcional)</Label>
              <Input
                id="dni"
                placeholder="Documento de identidad"
                value={newCustomerData.dni}
                onChange={(e) =>
                  setNewCustomerData({ ...newCustomerData, dni: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este dato se almacena de forma segura
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCustomer(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateQuickCustomer}
              disabled={createCustomerMutation.isPending || !newCustomerData.phoneOrEmail || !newCustomerData.name}
            >
              {createCustomerMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Crear Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escáner de códigos de barras */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Escanear Producto"
        onScan={async (code) => {
          try {
            const product = await productsApi.findByBarcode(code);
            if (product) {
              // Producto encontrado, agregarlo al carrito
              handleAddToCart(product);
              // Feedback visual extra si se quiere, pero handleAddToCart ya tiene toast
              setScannerOpen(false); // Opcional: cerrar scanner al encontrar? Mejor dejar abierto para escanear varios
            } else {
              toast.error("Producto no encontrado", {
                description: `No existe producto con código: ${code}`,
              });
            }
          } catch {
            toast.error("Producto no encontrado", {
              description: `No existe producto con código: ${code}`,
            });
          }
        }}
      />
    </MainLayout>
  );
}
