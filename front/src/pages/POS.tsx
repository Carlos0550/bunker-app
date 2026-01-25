import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Product, productsApi } from "@/api/services/products";
import { salesApi, SaleItem as SaleItemType, CreateSaleData, Sale } from "@/api/services/sales";
import { customersApi } from "@/api/services/customers";
import { businessApi, Multiplier } from "@/api/services/business";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Percent, 
  ShoppingCart,
  Receipt,
  Loader2,
  AlertCircle,
  UserPlus,
  CreditCard,
  User as UserIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  SaleSuccessDialog,
  ProductSearch,
  ManualProductInput,
  CartItemComponent,
  PaymentMethodSelector,
  type CartItem,
} from "@/components/pos";
import { formatCurrency } from "@/utils/helpers";

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
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showSaleSuccess, setShowSaleSuccess] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState<CartItem[]>([]);
  
  
  const barcodeBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);


  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["posProducts", searchTerm],
    queryFn: () =>
      productsApi.getProducts(
        { search: searchTerm || undefined },
        { page: 1, limit: 100 }
      ),
    staleTime: 1000,
  });

  const { user } = useAuthStore();
  const businessId = user?.businessId;

  
  const { data: multipliers = [] } = useQuery({
    queryKey: ["business", "multipliers", businessId],
    queryFn: businessApi.getMultipliers,
    staleTime: 60000,
    enabled: !!businessId,
  });

  
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["posCustomers"],
    queryFn: () => customersApi.getCustomers({ page: 1, limit: 100 }),
    enabled: isCredit,
    staleTime: 60000,
  });

  const products = productsData?.data || [];
  const customers = customersData?.data || [];

  
  const createCustomerMutation = useMutation({
    mutationFn: (data: typeof newCustomerData) => {
      
      const isEmail = data.phoneOrEmail.includes("@");
      return customersApi.createCustomer({
        identifier: data.phoneOrEmail,
        name: data.name,
        phone: !isEmail ? data.phoneOrEmail : undefined,
        email: isEmail ? data.phoneOrEmail : undefined,
        
        notes: data.dni ? `DNI: ${data.dni}` : undefined,
      });
    },
    onSuccess: (result) => {
      toast.success("Cliente creado exitosamente");
      
      setSelectedCustomer(result.customerId);
      setShowNewCustomer(false);
      setNewCustomerData({ phoneOrEmail: "", name: "", dni: "" });
      queryClient.invalidateQueries({ queryKey: ["posCustomers"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al crear cliente");
    },
  });


  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    
    if (existingItem) {
      
      if (product.stock !== undefined && existingItem.quantity >= product.stock) {
        toast.warning(`Atención: Stock excedido (${product.stock} disponibles)`);
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
      
      if (product.stock === 0) {
        toast.warning("Atención: Producto sin stock disponible");
      }
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
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isSearchInput = target.tagName === "INPUT" && 
                            (target as HTMLInputElement).placeholder?.includes("Buscar por nombre, SKU o código");

      const currentTime = Date.now();
      const isNewScan = currentTime - lastKeyTime.current > 300;
      lastKeyTime.current = currentTime;

      
      if (e.key === "Enter") {
        if (isSearchInput) {
          const input = target as HTMLInputElement;
          const value = input.value.trim();
          if (value.length >= 3) {
            e.preventDefault();
            processBarcode(value);
            setSearchTerm(""); 
          }
          return;
        }
        
        if (barcodeBuffer.current.length >= 3) {
          e.preventDefault();
          processBarcode(barcodeBuffer.current);
          barcodeBuffer.current = "";
        }
        return;
      }

      
      if (
        !isSearchInput && (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        )
      ) {
        return;
      }

      
      if (!isSearchInput && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const searchInput = document.querySelector('input[placeholder*="Buscar por nombre, SKU o código"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          
        }
      }

      
      if (e.key.length === 1 && !isSearchInput) {
        if (isNewScan) barcodeBuffer.current = "";
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart]); 

  const handleManualInput = async () => {
    if (!manualInput.trim()) return;

    
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

    
    if (!item.isManual && item.maxStock !== undefined && delta > 0) {
      if (newQty > item.maxStock) {
        toast.warning(`Atención: Stock excedido (${item.maxStock} disponibles)`);
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

  
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount =
    discountType === "PERCENTAGE" ? (subtotal * discount) / 100 : discount;
  
  
  const activeMultipliers = multipliers.filter((m: Multiplier) => {
    if (!m.isActive) return false;
    if (!m.paymentMethods.includes(paymentMethod)) return false;

    
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

  
  const processSale = async (ignoreStockWarning = false) => {
    if (cart.length === 0) {
      toast.error("Agrega productos al carrito");
      return;
    }

    if (isCredit && !selectedCustomer) {
      toast.error("Seleccione un cliente para venta a crédito");
      return;
    }

    
    if (!ignoreStockWarning) {
      const problematicItems = cart.filter(
        (item) =>
          !item.isManual &&
          item.maxStock !== undefined &&
          item.quantity > item.maxStock
      );

      if (problematicItems.length > 0) {
        setOutOfStockItems(problematicItems);
        setShowStockWarning(true);
        return;
      }
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
        total, 
      };

      const sale = await salesApi.createSale(saleData);

      
      setCompletedSale(sale);
      setShowSaleSuccess(true);
      setShowStockWarning(false); 

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
      <div className="relative">
        {}
        <div className="lg:mr-[420px] flex flex-col gap-4">
          <ManualProductInput
              value={manualInput}
              onChange={setManualInput}
              onSubmit={handleManualInput}
              onShowHelp={() => setShowManualHelp(true)}
            />
          <div className="flex flex-col gap-4 min-h-[calc(100vh-8rem)]">
            <ProductSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onScanClick={() => setScannerOpen(true)}
              products={products}
              isLoading={loadingProducts}
              onProductClick={handleAddToCart}
            />

            
          </div>
        </div>

        {}
        <button
          onClick={() => setShowCartModal(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 w-16 h-16 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-7 h-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold">
              {cart.length}
            </span>
          )}
        </button>

        {}
        <div className={`
          lg:fixed lg:top-20 lg:right-6 lg:w-[400px] lg:max-h-[calc(100vh-7rem)]
          ${showCartModal ? 'block' : 'hidden lg:block'}
        `}>
          {}
          {showCartModal && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowCartModal(false)}
            />
          )}

          {}
          <div className={`
            bunker-card flex flex-col overflow-hidden
            lg:relative
            ${showCartModal ? 'fixed inset-x-4 top-20 bottom-4 z-50 max-h-[calc(100vh-7rem)]' : ''}
          `} data-tour="pos-cart">
            {}
            <div className="p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Carrito
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{cart.length} items</Badge>
                  {}
                  {showCartModal && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden h-8 w-8"
                      onClick={() => setShowCartModal(false)}
                    >
                      <span className="text-xl">×</span>
                    </Button>
                  )}
                </div>
              </div>

              {}
              <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg" data-tour="pos-credit">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Venta a Crédito (Fiado)</span>
                </div>
                <Switch checked={isCredit} onCheckedChange={handleCreditToggle} />
              </div>

            {}
            {isCredit && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="flex-1 bg-secondary/50">
                      <UserIcon className="w-4 h-4 mr-2" />
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

          {}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2 min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
                <p>Carrito vacío</p>
                <p className="text-sm">Agrega productos para comenzar</p>
              </div>
            ) : (
              cart.map((item) => (
                <CartItemComponent
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                />
              ))
            )}
          </div>

          {}
          <div className="p-4 border-t border-border space-y-4 flex-shrink-0">
            {}
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

            {}
            <Textarea
              placeholder="Notas de la venta (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary/50 h-16 resize-none"
            />

            {}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>
                    Descuento ({discountType === "PERCENTAGE" ? `${discount}%` : formatCurrency(discount)})
                  </span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {activeMultipliers.map((multiplier: Multiplier) => (
                <div key={multiplier.id} className="flex justify-between text-muted-foreground">
                  <span>{multiplier.name} ({(multiplier.value * 100).toFixed(2)}%)</span>
                  <span>{formatCurrency((subtotal - discountAmount) * multiplier.value)}</span>
                </div>
              ))}
              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            {}
            {!isCredit && (
              <PaymentMethodSelector
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                installments={installments}
                onInstallmentsChange={setInstallments}
              />
            )}

            {}
            <Button
              className="w-full h-12 text-lg font-semibold bunker-glow"
              onClick={() => processSale(false)}
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
      </div>

      {}
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

      {}
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

      {}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Escanear Producto"
        onScan={async (code) => {
          try {
            const product = await productsApi.findByBarcode(code);
            if (product) {
              
              handleAddToCart(product);
              
              setScannerOpen(false); 
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
      
      {}
      <AlertDialog open={showStockWarning} onOpenChange={setShowStockWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-5 h-5" />
              Stock Insuficiente
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>
                  Los siguientes productos superan el stock disponible:
                </p>
                <div className="bg-secondary/30 p-3 rounded-lg space-y-2 max-h-[200px] overflow-y-auto">
                  {outOfStockItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-destructive">
                         Solicitado: {item.quantity} | Disponible: {item.maxStock}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="font-medium text-foreground">
                  ¿Deseas continuar?
                </p>
                <p className="text-sm">
                  Al confirmar, el sistema ajustará automáticamente el stock de estos productos 
                  para permitir la venta (Stock mínimo + 1).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => processSale(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Confirmar y Procesar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {}
      <SaleSuccessDialog
        open={showSaleSuccess}
        onClose={() => {
          setShowSaleSuccess(false);
          setCompletedSale(null);
        }}
        sale={completedSale}
        businessName="BUNKER"
      />
    </MainLayout>
  );
}
