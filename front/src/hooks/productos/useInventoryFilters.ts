import { useState } from "react";

export const useInventoryFilters = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [categoryId, setCategoryId] = useState("all");
  const [state, setState] = useState("all");
  const [lowStock, setLowStock] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);

  const resetFilters = () => {
    setSearch("");
    setPage(1);
    setCategoryId("all");
    setState("all");
    setLowStock(undefined);
    setSortBy(undefined);
  };

  const clearFilters = () => {
      setLowStock(undefined);
      setState("all");
      setCategoryId("all");
      setSortBy(undefined);
  }

  return {
    search, setSearch,
    page, setPage,
    limit, setLimit,
    categoryId, setCategoryId,
    state, setState,
    lowStock, setLowStock,
    sortBy, setSortBy,
    resetFilters,
    clearFilters
  };
};
