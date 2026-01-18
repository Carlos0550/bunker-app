import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Loader2, Trash } from "lucide-react";
import { BusinessCustomer } from "@/api/services/customers";

interface CustomerListProps {
  customers: BusinessCustomer[];
  selectedCustomerId?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectCustomer: (customer: BusinessCustomer) => void;
  onDeleteCustomer: (customer: BusinessCustomer, e?: React.MouseEvent) => void;
  isLoading: boolean;
}

export function CustomerList({
  customers,
  selectedCustomerId,
  searchTerm,
  onSearchChange,
  onSelectCustomer,
  onDeleteCustomer,
  isLoading,
}: CustomerListProps) {
  return (
    <div className="lg:col-span-1 bunker-card flex flex-col min-h-0" data-tour="clientes-list">
      <div className="p-3 border-b border-border" data-tour="clientes-search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <Users className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm">No hay clientes</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {customers.map((bc) => (
              <button
                key={bc.id}
                onClick={() => onSelectCustomer(bc)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedCustomerId === bc.id
                    ? "bg-primary/20 border border-primary/30"
                    : "hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    (bc.totalDebt || 0) > 0 ? "bg-destructive/20" : "bg-primary/20"
                  }`}>
                    <Users className={`w-5 h-5 ${
                      (bc.totalDebt || 0) > 0 ? "text-destructive" : "text-primary"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground truncate">
                        {bc.customer.name}
                      </p>
                      <div className="flex items-center gap-1">
                        {(bc.totalDebt || 0) > 0 && (
                          <span className="text-sm font-bold text-destructive whitespace-nowrap">
                            ${bc.totalDebt?.toLocaleString()}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => onDeleteCustomer(bc, e)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {bc.customer.identifier}
                    </p>
                    {(bc.activeAccounts || 0) > 0 && (
                      <Badge variant="outline" className="mt-1 text-xs border-warning text-warning">
                        {bc.activeAccounts} cuenta{bc.activeAccounts !== 1 ? "s" : ""} activa{bc.activeAccounts !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
