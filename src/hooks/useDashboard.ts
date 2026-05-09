import { useQuery } from "@tanstack/react-query";

import type { DashboardData } from "@/application/dashboard/getDashboardData";

/**
 * Hook que consulta GET /api/dashboard.
 * La query key es `["dashboard"]` — invalida con `queryClient.invalidateQueries`
 * tras cambios en portfolio, paper o watchlist.
 */
export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("failed to fetch dashboard");
      return res.json() as Promise<DashboardData>;
    },
    // Refrescar cada 60s para mantener el snapshot de mercado actualizado.
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}
