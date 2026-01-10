import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importApi, AnalyzeResult, ColumnMapping, SystemColumn } from "@/api/services/import";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  Loader2,
  FileWarning,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImportProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "mapping" | "processing" | "result";

export function ImportProductsModal({ open, onOpenChange }: ImportProductsModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [importResult, setImportResult] = useState<{ imported: number; failed: number; errors: any[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("upload");
      setSelectedFile(null);
      setAnalyzeResult(null);
      setColumnMapping({});
      setImportResult(null);
    }
  }, [open]);

  // Mutations
  const analyzeMutation = useMutation({
    mutationFn: (file: File) => importApi.analyzeFile(file),
    onSuccess: (result) => {
      setAnalyzeResult(result);
      setColumnMapping(result.suggestedMapping);
      setStep("mapping");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al analizar el archivo");
    },
  });

  const processMutation = useMutation({
    mutationFn: ({ sessionId, mapping }: { sessionId: string; mapping: ColumnMapping }) =>
      importApi.processImport(sessionId, mapping),
    onSuccess: (result) => {
      setImportResult(result);
      setStep("result");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Error al procesar la importación");
      setStep("mapping");
    },
  });

  // Handlers
  const handleFileSelect = useCallback((file: File) => {
    const validExtensions = ["csv", "xls", "xlsx"];
    const extension = file.name.split(".").pop()?.toLowerCase();
    
    if (!extension || !validExtensions.includes(extension)) {
      toast.error("Solo se permiten archivos CSV, XLS o XLSX");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no puede superar los 10MB");
      return;
    }

    setSelectedFile(file);
    analyzeMutation.mutate(file);
  }, [analyzeMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMappingChange = (fileColumn: string, systemColumn: string) => {
    setColumnMapping((prev) => {
      const newMapping = { ...prev };
      
      // Si se selecciona "none", eliminar el mapeo
      if (systemColumn === "none") {
        delete newMapping[fileColumn];
      } else {
        // Eliminar mapeos existentes a esta columna del sistema (evitar duplicados)
        Object.keys(newMapping).forEach((key) => {
          if (newMapping[key] === systemColumn && key !== fileColumn) {
            delete newMapping[key];
          }
        });
        newMapping[fileColumn] = systemColumn;
      }
      
      return newMapping;
    });
  };

  const handleProcessImport = () => {
    if (!analyzeResult) return;

    // Validar columnas requeridas
    const requiredColumns = analyzeResult.systemColumns.filter((c) => c.required);
    const mappedSystemColumns = Object.values(columnMapping);

    for (const col of requiredColumns) {
      if (!mappedSystemColumns.includes(col.key)) {
        toast.error(`Debes mapear la columna "${col.label}" (requerida)`);
        return;
      }
    }

    setStep("processing");
    processMutation.mutate({
      sessionId: analyzeResult.sessionId,
      mapping: columnMapping,
    });
  };

  const handleClose = () => {
    if (analyzeResult?.sessionId && step !== "result") {
      importApi.cancelImport(analyzeResult.sessionId).catch(() => {});
    }
    onOpenChange(false);
  };

  // Verificar si una columna del sistema ya está mapeada
  const isSystemColumnMapped = (systemKey: string, excludeFileColumn?: string) => {
    return Object.entries(columnMapping).some(
      ([fileCol, sysCol]) => sysCol === systemKey && fileCol !== excludeFileColumn
    );
  };

  // Obtener el mapeo inverso (systemColumn -> fileColumn)
  const getFileColumnForSystem = (systemKey: string) => {
    return Object.entries(columnMapping).find(([_, sysCol]) => sysCol === systemKey)?.[0];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Productos
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Sube un archivo CSV o Excel con tus productos"}
            {step === "mapping" && "Mapea las columnas del archivo con las del sistema"}
            {step === "processing" && "Procesando importación..."}
            {step === "result" && "Resultado de la importación"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {/* Step: Upload */}
          {step === "upload" && (
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center transition-all",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {analyzeMutation.isPending ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                  <p className="text-muted-foreground">Analizando archivo...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Arrastra tu archivo aquí o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Formatos soportados: CSV, XLS, XLSX (máx. 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Seleccionar Archivo
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step: Mapping */}
          {step === "mapping" && analyzeResult && (
            <div className="space-y-6">
              {/* Info del archivo */}
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {analyzeResult.totalRows} filas detectadas • {analyzeResult.headers.length} columnas
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-primary">
                  {Object.keys(columnMapping).length} / {analyzeResult.systemColumns.filter(c => c.required).length} requeridas
                </Badge>
              </div>

              {/* Mapeo visual */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
                {/* Columnas del archivo CSV */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                    Columnas del Archivo
                  </h4>
                  <div className="space-y-2">
                    {analyzeResult.headers.map((header) => {
                      const mappedTo = columnMapping[header];
                      const systemCol = analyzeResult.systemColumns.find(c => c.key === mappedTo);
                      
                      return (
                        <div
                          key={header}
                          className={cn(
                            "p-3 rounded-lg border transition-all",
                            mappedTo
                              ? "border-primary/50 bg-primary/5"
                              : "border-border bg-secondary/20"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{header}</span>
                            {mappedTo && (
                              <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                          {mappedTo && systemCol && (
                            <p className="text-xs text-muted-foreground mt-1">
                              → {systemCol.label}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Flecha central */}
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-px h-full bg-border relative">
                    <ChevronRight className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background" />
                  </div>
                </div>

                {/* Columnas del sistema */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                    Columnas del Sistema
                  </h4>
                  <div className="space-y-2">
                    {analyzeResult.systemColumns.map((sysCol) => {
                      const mappedFrom = getFileColumnForSystem(sysCol.key);
                      
                      return (
                        <div
                          key={sysCol.key}
                          className={cn(
                            "p-3 rounded-lg border transition-all",
                            mappedFrom
                              ? "border-primary/50 bg-primary/5"
                              : sysCol.required
                              ? "border-destructive/50 bg-destructive/5"
                              : "border-border bg-secondary/20"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium truncate">{sysCol.label}</span>
                              {sysCol.required && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                  Requerido
                                </Badge>
                              )}
                            </div>
                            {mappedFrom ? (
                              <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            ) : sysCol.required ? (
                              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                            ) : null}
                          </div>
                          
                          <Select
                            value={mappedFrom || "none"}
                            onValueChange={(value) => {
                              if (value === "none") {
                                // Encontrar y eliminar el mapeo actual
                                const currentMapping = Object.entries(columnMapping).find(
                                  ([_, sys]) => sys === sysCol.key
                                );
                                if (currentMapping) {
                                  handleMappingChange(currentMapping[0], "none");
                                }
                              } else {
                                handleMappingChange(value, sysCol.key);
                              }
                            }}
                          >
                            <SelectTrigger className="mt-2 h-8 text-xs">
                              <SelectValue placeholder="Seleccionar columna..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="text-muted-foreground">Sin mapear</span>
                              </SelectItem>
                              {analyzeResult.headers.map((header) => {
                                const isMapped = isSystemColumnMapped(
                                  columnMapping[header],
                                  header
                                ) && columnMapping[header] !== sysCol.key;
                                
                                return (
                                  <SelectItem
                                    key={header}
                                    value={header}
                                    disabled={isMapped && columnMapping[header] !== sysCol.key}
                                  >
                                    {header}
                                    {columnMapping[header] === sysCol.key && " ✓"}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Preview de datos */}
              <div>
                <h4 className="font-semibold mb-3">Vista previa de datos</h4>
                <div className="border rounded-lg overflow-auto max-h-48">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {analyzeResult.headers.map((header) => (
                          <TableHead key={header} className="whitespace-nowrap">
                            {header}
                            {columnMapping[header] && (
                              <Badge variant="outline" className="ml-2 text-[10px]">
                                {analyzeResult.systemColumns.find(c => c.key === columnMapping[header])?.label}
                              </Badge>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyzeResult.previewData.map((row, i) => (
                        <TableRow key={i}>
                          {analyzeResult.headers.map((header) => (
                            <TableCell key={header} className="whitespace-nowrap">
                              {row[header] || "-"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Mostrando {analyzeResult.previewData.length} de {analyzeResult.totalRows} filas
                </p>
              </div>
            </div>
          )}

          {/* Step: Processing */}
          {step === "processing" && (
            <div className="py-12 text-center space-y-6">
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
              <div>
                <p className="text-lg font-medium">Importando productos...</p>
                <p className="text-sm text-muted-foreground">
                  Esto puede tomar unos momentos
                </p>
              </div>
              <Progress value={undefined} className="w-64 mx-auto" />
            </div>
          )}

          {/* Step: Result */}
          {step === "result" && importResult && (
            <div className="py-8 space-y-6">
              <div className="text-center">
                {importResult.failed === 0 ? (
                  <CheckCircle2 className="w-16 h-16 mx-auto text-success mb-4" />
                ) : importResult.imported === 0 ? (
                  <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
                ) : (
                  <AlertTriangle className="w-16 h-16 mx-auto text-warning mb-4" />
                )}
                
                <h3 className="text-xl font-bold mb-2">
                  {importResult.failed === 0
                    ? "¡Importación exitosa!"
                    : importResult.imported === 0
                    ? "Error en la importación"
                    : "Importación completada con errores"}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="text-center p-4 bg-success/10 rounded-lg border border-success/30">
                  <p className="text-3xl font-bold text-success">{importResult.imported}</p>
                  <p className="text-sm text-muted-foreground">Productos importados</p>
                </div>
                <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                  <p className="text-3xl font-bold text-destructive">{importResult.failed}</p>
                  <p className="text-sm text-muted-foreground">Con errores</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileWarning className="w-4 h-4 text-destructive" />
                    Errores encontrados ({importResult.failed})
                  </h4>
                  <div className="border rounded-lg overflow-auto max-h-48">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Fila</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.map((err, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono">{err.row}</TableCell>
                            <TableCell className="text-destructive">{err.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {importResult.failed > importResult.errors.length && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Mostrando {importResult.errors.length} de {importResult.failed} errores
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleProcessImport}
                disabled={processMutation.isPending}
                className="bunker-glow"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Importar {analyzeResult?.totalRows} productos
              </Button>
            </>
          )}

          {step === "result" && (
            <Button onClick={handleClose} className="bunker-glow">
              <Check className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
