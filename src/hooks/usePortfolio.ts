import { useQuery } from "@tanstack/react-query";

import type { PortfolioMetrics } from "@/application/portfolio/computePortfolioMetrics";
import type { HoldingWithQuote } from "@/application/portfolio/getHoldings";

/**
 * Respuesta del endpoint GET /api/portfolio.
 */
interface PortfolioResponse {
  holdings: HoldingWithQuote[];
  metrics: PortfolioMetrics;
}

/**
 * Hook que obtiene los holdings y métricas del portafolio del usuario.
 * Implementación stub temporal hasta Batch E donde se extiende con
 * opciones de refetch y mutaciones.
 */
export function usePortfolio() {
  return useQuery<PortfolioResponse>({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio");
      if (!res.ok) throw new Error("failed to fetch portfolio");
      return res.json() as Promise<PortfolioResponse>;
    },
  });
}
