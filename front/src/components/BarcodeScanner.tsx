import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  CameraOff,
  ScanLine,
  Keyboard,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";


const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
];


const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
}

export function BarcodeScanner({
  open,
  onClose,
  onScan,
  title = "Escanear Codigo de Barras",
}: BarcodeScannerProps) {
  
  const [activeTab, setActiveTab] = useState<"camera" | "manual">(
    isMobileDevice() ? "camera" : "manual"
  );
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);
  const scannerContainerId = "barcode-scanner-container";

  
  useEffect(() => {
    if (open) {
      isProcessingRef.current = false;
    }
  }, [open]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        const state = scanner.getState();
        if (state === 2) {
          await scanner.stop();
        }
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      try {
        scanner.clear();
      } catch {
        
      }
      scannerRef.current = null;
    }
  }, []);

  const handleScanSuccess = useCallback((code: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    
    onScan(code.trim());
    
    
    onClose();
  }, [onScan, onClose]);

  const startScanner = useCallback(async (camId: string) => {
    try {
      await stopScanner();
      await new Promise((resolve) => setTimeout(resolve, 150));

      
      const container = document.getElementById(scannerContainerId);
      if (!container) {
        console.warn("Scanner container not yet mounted");
        return;
      }

      const html5Qrcode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: BARCODE_FORMATS,
        verbose: false,
      });
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        camId,
        {
          fps: 15,
          qrbox: { width: 280, height: 100 },
          aspectRatio: 1.777778,
          disableFlip: false,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError("Error al iniciar el escaner. Intenta con el modo manual.");
    }
  }, [stopScanner, handleScanSuccess]);

  const initScanner = useCallback(async () => {
    setError(null);
    setIsScanning(true);

    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setAvailableCameras(devices);
        const backCamera = devices.find(
          (d) => d.label.toLowerCase().includes("back") || 
                 d.label.toLowerCase().includes("trasera") ||
                 d.label.toLowerCase().includes("rear")
        );
        const selectedCamera = backCamera || devices[devices.length - 1];
        setCameraId(selectedCamera.id);
        await startScanner(selectedCamera.id);
      } else {
        setError("No se encontraron camaras. Usa el modo manual.");
        setActiveTab("manual");
      }
    } catch (err) {
      console.error("Error initializing scanner:", err);
      setError("No se pudo acceder a la camara. Usa el modo manual.");
      setActiveTab("manual");
    } finally {
      setIsScanning(false);
    }
  }, [startScanner]);

  useEffect(() => {
    if (open && activeTab === "camera") {
      initScanner();
    } else if (open && activeTab === "manual") {
      
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => {
      stopScanner();
    };
  }, [open, activeTab, initScanner, stopScanner]);

  
  useEffect(() => {
    if (!open) {
      setManualCode("");
      setError(null);
      
      setActiveTab(isMobileDevice() ? "camera" : "manual");
    }
  }, [open]);


  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (code) {
      onScan(code);
      setManualCode("");
      onClose();
    }
  };

  const handleClose = () => {
    stopScanner();
    setManualCode("");
    setError(null);
    onClose();
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;

    const currentIndex = availableCameras.findIndex((c) => c.id === cameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];

    setCameraId(nextCamera.id);
    await startScanner(nextCamera.id);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {isMobileDevice() 
              ? "Escanea el codigo de barras o ingresalo manualmente."
              : "Ingresa el codigo de barras. Si tenes un lector USB, solo escanea."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "camera" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Camara
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="mt-4">
            <div className="space-y-3">
              {error ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <CameraOff className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">{error}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={initScanner}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reintentar
                    </Button>
                    <Button size="sm" onClick={() => setActiveTab("manual")}>
                      <Keyboard className="w-4 h-4 mr-2" />
                      Modo Manual
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    id={scannerContainerId}
                    className="w-full min-h-[220px] rounded-lg overflow-hidden bg-black"
                  />

                  {isScanning && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Iniciando camara...
                    </div>
                  )}

                  {availableCameras.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={switchCamera}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Cambiar Camara
                    </Button>
                  )}

                  <div className="flex items-start gap-2 p-3 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p>Coloca el codigo de barras dentro del recuadro.</p>
                      <p className="text-xs mt-1">
                        Si no detecta, usa el <button 
                          className="text-primary underline" 
                          onClick={() => setActiveTab("manual")}
                        >modo manual</button>.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="manual-barcode">Codigo de Barras</Label>
                <Input
                  ref={inputRef}
                  id="manual-barcode"
                  placeholder="Escribe o escanea con lector USB..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleManualSubmit();
                    }
                  }}
                  autoFocus
                  autoComplete="off"
                  className="text-lg font-mono"
                />
              </div>
              
              <div className="p-3 bg-secondary/30 rounded-lg text-sm text-muted-foreground space-y-2">
                <p><strong>Formas de ingresar:</strong></p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>Escribi el numero que esta debajo del codigo de barras</li>
                  <li>Usa un lector de codigo de barras USB (escanea y presiona Enter automaticamente)</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {activeTab === "manual" && (
            <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>
              Confirmar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
