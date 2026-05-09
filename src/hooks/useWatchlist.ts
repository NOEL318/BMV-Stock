import { useQuery } from "@tanstack/react-query";

import type { WatchlistEntry } from "@/application/watchlist/getWatchlistWithQuotes";

/** Respuesta del endpoint GET /api/watchlist. */
interface WatchlistResponse {
  entries: WatchlistEntry[];
}

/**
 * Hook que consulta GET /api/watchlist. Cachea con TanStack Query.
 * La query key es `["watchlist"]` — invalidar con `queryClient.invalidateQueries`
 * tras un POST o DELETE.
 */
export function useWatchlist() {
  return useQuery<WatchlistResponse>({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const res = await fetch("/api/watchlist");
      if (!res.ok) throw new Error("failed to fetch watchlist");
      return res.json() as Promise<WatchlistResponse>;
    },
    // Refrescar cada 45s para mantener cotizaciones casi en vivo.
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
  });
}
