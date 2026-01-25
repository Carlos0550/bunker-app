import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ScanLine, AlertTriangle, Filter, X } from "lucide-react";
import { Category } from "@/api/services/products";

type SortOption = "price_asc" | "price_desc" | "stock_asc" | "stock_desc" | "name_asc" | "name_desc";
type StateFilter = "all" | "ACTIVE" | "OUT_OF_STOCK" | "DISABLED";

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  lowStock?: boolean;
  onLowStockChange: (value: boolean | undefined) => void;
  state: StateFilter;
  onStateChange: (value: StateFilter) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  sortBy?: SortOption;
  onSortChange: (value: SortOption | undefined) => void;
  categories: Category[];
  onScanClick: () => void;
  onClearFilters: () => void;
}

export function ProductFilters({
  search,
  onSearchChange,
  lowStock,
  onLowStockChange,
  state,
  onStateChange,
  categoryId,
  onCategoryChange,
  sortBy,
  onSortChange,
  categories,
  onScanClick,
  onClearFilters,
}: ProductFiltersProps) {
  const hasActiveFilters = lowStock !== undefined || state !== "all" || categoryId !== "all" || sortBy;

  return (
    <div className="space-y-3">
      {}
      <div className="flex gap-2" data-tour="productos-search">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, SKU o código de barras..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-card text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 h-9 w-9 sm:h-10 sm:w-auto sm:px-4"
          onClick={onScanClick}
          title="Escanear código de barras"
        >
          <ScanLine className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Escanear</span>
        </Button>
      </div>

      {}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
        <div className="flex-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
          <div className="flex gap-1.5 sm:gap-2 items-center w-max min-w-full sm:min-w-0">
            {}
            <Button
              variant={lowStock === true ? "default" : "outline"}
              size="sm"
              className="h-8 sm:h-7 text-xs shrink-0 whitespace-nowrap"
              onClick={() => onLowStockChange(lowStock === true ? undefined : true)}
            >
              <AlertTriangle className={`w-3 h-3 sm:mr-1 ${lowStock === true ? "" : "text-warning"}`} />
              <span className="hidden sm:inline">Bajo</span>
            </Button>

            {}
            <Select value={state} onValueChange={(value: StateFilter) => onStateChange(value)}>
              <SelectTrigger className="h-8 sm:h-7 text-xs w-[100px] sm:w-[110px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ACTIVE">Activos</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Sin Stock</SelectItem>
                <SelectItem value="DISABLED">Deshabilitados</SelectItem>
              </SelectContent>
            </Select>

            {}
            <Select value={categoryId} onValueChange={onCategoryChange}>
              <SelectTrigger className="h-8 sm:h-7 text-xs w-[110px] sm:w-[120px] shrink-0">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {}
            <Select
              value={sortBy || "none"}
              onValueChange={(value) => onSortChange(value === "none" ? undefined : value as SortOption)}
            >
              <SelectTrigger className="h-8 sm:h-7 text-xs w-[90px] sm:w-[100px] shrink-0">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin orden</SelectItem>
                <SelectItem value="price_desc">Precio ↓</SelectItem>
                <SelectItem value="price_asc">Precio ↑</SelectItem>
                <SelectItem value="stock_desc">Stock ↓</SelectItem>
                <SelectItem value="stock_asc">Stock ↑</SelectItem>
                <SelectItem value="name_asc">A-Z</SelectItem>
                <SelectItem value="name_desc">Z-A</SelectItem>
              </SelectContent>
            </Select>

            {}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 sm:h-7 text-xs px-2 sm:px-2 shrink-0"
                onClick={onClearFilters}
                title="Limpiar filtros"
              >
                <X className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline ml-1">Limpiar</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
