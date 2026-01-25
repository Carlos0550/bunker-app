import { useRef, useEffect } from "react";

export const useBarcodeScanner = (onScan: (code: string) => void) => {
  const barcodeBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);

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
            onScan(value);
            
            setTimeout(() => input.select(), 10);
          }
          return;
        }
        
        if (barcodeBuffer.current.length >= 3) {
          e.preventDefault();
          onScan(barcodeBuffer.current);
          barcodeBuffer.current = "";
        }
        return;
      }

      
      const activeElement = document.activeElement as HTMLElement;
      if (!isSearchInput && (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          activeElement?.tagName === "INPUT" ||
          activeElement?.tagName === "TEXTAREA" ||
          activeElement?.isContentEditable
      )) {
        return;
      }

      
      if (!isSearchInput && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const searchInput = document.querySelector('input[placeholder*="Buscar por nombre, SKU o código"]') as HTMLInputElement;
        if (searchInput) {
          
          searchInput.focus();
          
          if (searchInput.value === "") {
             
          }
        }
      }

      
      if (e.key.length === 1 && !isSearchInput) {
        if (isNewScan) barcodeBuffer.current = "";
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScan]);
};
