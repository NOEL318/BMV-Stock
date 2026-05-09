import { useQuery } from "@tanstack/react-query";

import type { PaperTrade } from "@/domain/entities/PaperTrade";

/** Respuesta del endpoint GET /api/paper-trading/trades. */
interface PaperTradesResponse {
  trades: PaperTrade[];
}

/**
 * Hook para listar todos los paper trades del usuario.
 */
export function usePaperTrades() {
  return useQuery<PaperTradesResponse>({
    queryKey: ["paper-trades"],
    queryFn: async () => {
      const res = await fetch("/api/paper-trading/trades");
      if (!res.ok) throw new Error("failed to fetch paper trades");
      return res.json() as Promise<PaperTradesResponse>;
    },
  });
}
