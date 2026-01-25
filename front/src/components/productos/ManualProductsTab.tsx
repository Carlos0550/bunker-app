import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  HelpCircle, 
  FileQuestion, 
  MoreVertical,
  Edit2,
  Link2,
  PackagePlus,
  Ban,
  Loader2
} from "lucide-react";
import { ManualProduct } from "@/api/services/sales";
import { LoadingContainer, EmptyState } from "@/components/shared";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ManualProductsTabProps {
  products: ManualProduct[];
  isLoading: boolean;
  onEdit: (product: ManualProduct) => void;
  onLink: (product: ManualProduct) => void;
  onConvert: (id: string) => void;
  onIgnore: (id: string) => void;
  convertLoading?: boolean;
  ignoreLoading?: boolean;
}

export function ManualProductsTab({
  products,
  isLoading,
  onEdit,
  onLink,
  onConvert,
  onIgnore,
  convertLoading,
  ignoreLoading,
}: ManualProductsTabProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="border-blue-500 text-blue-400">Pendiente</Badge>;
      case "LINKED":
        return <Badge variant="outline" className="border-success text-success">Vinculado</Badge>;
      case "CONVERTED":
        return <Badge variant="outline" className="border-primary text-primary">Convertido</Badge>;
      case "IGNORED":
        return <Badge variant="secondary">Ignorado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {}
      <div className="bunker-card p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground">¿Qué son los productos manuales?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Son productos agregados manualmente en el Punto de Venta que no existían en el catálogo. 
              Puedes vincularlos a productos existentes, convertirlos en nuevos productos, o ignorarlos.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingContainer size="lg" />
      ) : products.length === 0 ? (
        <div className="bunker-card p-12">
          <EmptyState
            icon={FileQuestion}
            title="Sin productos manuales"
            description="Los productos agregados manualmente en el POS aparecerán aquí"
          />
        </div>
      ) : (
        <div className="bunker-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground min-w-[150px]">Producto</TableHead>
                  <TableHead className="text-muted-foreground text-right">Precio</TableHead>
                  <TableHead className="text-muted-foreground text-center hidden sm:table-cell">Cantidad</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="text-muted-foreground hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((mp) => (
                  <TableRow key={mp.id} className="border-border">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{mp.name}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                          {mp.originalText}
                        </p>
                        {}
                        <div className="sm:hidden mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>x{mp.quantity}</span>
                          <span>•</span>
                          {getStatusBadge(mp.status)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground whitespace-nowrap">
                      ${mp.price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground hidden sm:table-cell">
                      {mp.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {format(new Date(mp.createdAt), "dd MMM, HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {getStatusBadge(mp.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {mp.status === "PENDING" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(mp)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onLink(mp)}>
                              <Link2 className="w-4 h-4 mr-2" />
                              Vincular a producto
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onConvert(mp.id)}
                              disabled={convertLoading}
                            >
                              {convertLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <PackagePlus className="w-4 h-4 mr-2" />
                              )}
                              Crear como producto
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onIgnore(mp.id)}
                              disabled={ignoreLoading}
                              className="text-muted-foreground"
                            >
                              {ignoreLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Ban className="w-4 h-4 mr-2" />
                              )}
                              Ignorar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
