import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/services/analytics";

type Period = "today" | "yesterday" | "week" | "month";

// ============================================================================
// Query Hooks
// ============================================================================

export function useSalesSummary(
  period: Period,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: ["salesSummary", period, startDate, endDate],
    queryFn: () => analyticsApi.getSalesSummary(period, startDate, endDate),
  });
}

export function useTopProducts(limit: number = 10, period?: string) {
  return useQuery({
    queryKey: ["topProducts", limit, period],
    queryFn: () => analyticsApi.getTopProducts(limit, period),
  });
}

export function useSalesChart(period: Period = "week") {
  return useQuery({
    queryKey: ["salesChart", period],
    queryFn: () => analyticsApi.getSalesChart(period),
  });
}

export function useRecentSales(limit: number = 10) {
  return useQuery({
    queryKey: ["recentSales", limit],
    queryFn: () => analyticsApi.getRecentSales(limit),
  });
}
