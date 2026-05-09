import { useQuery } from "@tanstack/react-query";

import type { SuggestedTickerData } from "@/application/suggestions/getSuggestedTickersData";

/** Respuesta del endpoint GET /api/suggested-tickers. */
interface SuggestedTickersResponse {
  entries: SuggestedTickerData[];
}

/**
 * Hook que consulta GET /api/suggested-tickers. Cachea con TanStack Query.
 * Se refresca cada 5 min en segundo plano (los precios cambian más rápido,
 * pero esta lista es contextual y no requiere precisión al segundo).
 */
export function useSuggestedTickers() {
  return useQuery<SuggestedTickersResponse>({
    queryKey: ["suggested-tickers"],
    queryFn: async () => {
      const res = await fetch("/api/suggested-tickers");
      if (!res.ok) throw new Error("failed to fetch suggested tickers");
      return res.json() as Promise<SuggestedTickersResponse>;
    },
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
    // El stale time es alto porque las sugerencias son una lista contextual,
    // no datos críticos. La cache evita peticiones redundantes al navegar.
    staleTime: 2 * 60_000,
  });
}
