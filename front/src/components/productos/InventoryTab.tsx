import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ProductFilters, ProductCard, ProductTable } from "@/components/productos";
import { EmptyState, LoadingContainer } from "@/components/shared";
import { Product, Category } from "@/api/services/products";


interface InventoryTabProps {
    products: Product[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
        limit: number;
    } | undefined;
    loading: boolean;
    filters: {
        search: string;
        setSearch: (v: string) => void;
        lowStock: boolean | undefined;
        setLowStock: (v: boolean | undefined) => void;
        state: string;
        setState: (v: string) => void;
        categoryId: string;
        setCategoryId: (v: string) => void;
        sortBy: string | undefined;
        setSortBy: (v: string | undefined) => void;
        page: number;
        setPage: (v: number | ((prev: number) => number)) => void;
        limit: number;
        setLimit: (v: number) => void;
        clearFilters: () => void;
    };
    categories: Category[];
    onOpenNewProduct: () => void;
    onAdjustStock: (p: Product) => void;
    onEdit: (p: Product) => void;
    onToggleState: (p: Product) => void;
    onDelete: (p: Product) => void;
    onScanClick: () => void;
    getStateBadge: (state: string, stock: number, minStock: number) => React.ReactNode;
}


type SortOption = "price_asc" | "price_desc" | "stock_asc" | "stock_desc" | "name_asc" | "name_desc";
type StateFilter = "all" | "ACTIVE" | "OUT_OF_STOCK" | "DISABLED";

export const InventoryTab = ({
    products,
    pagination,
    loading,
    filters,
    categories,
    onOpenNewProduct,
    onAdjustStock,
    onEdit,
    onToggleState,
    onDelete,
    onScanClick,
    getStateBadge
}: InventoryTabProps) => {
    return (
        <div className="space-y-4">
            <ProductFilters
                search={filters.search}
                onSearchChange={filters.setSearch}
                lowStock={filters.lowStock}
                onLowStockChange={filters.setLowStock}
                state={filters.state as StateFilter}
                onStateChange={(v) => filters.setState(v)}
                categoryId={filters.categoryId}
                onCategoryChange={filters.setCategoryId}
                sortBy={filters.sortBy as SortOption | undefined}
                onSortChange={(v) => filters.setSortBy(v)}
                categories={categories}
                onScanClick={onScanClick}
                onClearFilters={filters.clearFilters}
            />

            {loading ? (
                <div className="p-12"><LoadingContainer /></div>
            ) : products.length === 0 ? (
                <div className="bunker-card">
                    <EmptyState
                        icon={Package}
                        title="No hay productos"
                        description={filters.search ? "No se encontraron productos con ese criterio" : "Agrega tu primer producto"}
                        action={
                            !filters.search && (
                                <Button onClick={onOpenNewProduct}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar Producto
                                </Button>
                            )
                        }
                    />
                </div>
            ) : (
                <>
                    {}
                    {pagination && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground pb-2">
                            <div className="flex items-center gap-2">
                                <span>Mostrar:</span>
                                <Select
                                    value={filters.limit.toString()}
                                    onValueChange={(v) => {
                                        filters.setLimit(Number(v));
                                        filters.setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={filters.limit} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p>
                                Mostrando {products.length} de {pagination.total} productos
                            </p>
                        </div>
                    )}

                    {}
                    <div className="md:hidden space-y-2">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAdjustStock={onAdjustStock}
                                onEdit={onEdit}
                                onToggleState={onToggleState}
                                onDelete={onDelete}
                                getStateBadge={getStateBadge}
                            />
                        ))}
                    </div>

                    {}
                    <div className="bunker-card overflow-hidden">
                        <ProductTable
                            products={products}
                            onAdjustStock={onAdjustStock}
                            onEdit={onEdit}
                            onToggleState={onToggleState}
                            onDelete={onDelete}
                            getStateBadge={getStateBadge}
                        />
                    </div>

                    {}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex justify-center sm:justify-end mt-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => filters.setPage(p => Math.max(1, p - 1))}
                                            className={filters.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>

                                    {}
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else {
                                            if (filters.page <= 3) {
                                                pageNum = i + 1;
                                            } else if (filters.page >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = filters.page - 2 + i;
                                            }
                                        }

                                        return (
                                            <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                    isActive={filters.page === pageNum}
                                                    onClick={() => filters.setPage(pageNum)}
                                                    className="cursor-pointer"
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}

                                    {pagination.totalPages > 5 && filters.page < pagination.totalPages - 2 && (
                                        <>
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationLink
                                                    onClick={() => filters.setPage(pagination.totalPages)}
                                                    className="cursor-pointer"
                                                >
                                                    {pagination.totalPages}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </>
                                    )}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => filters.setPage(p => Math.min(pagination.totalPages, p + 1))}
                                            className={filters.page >= pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
