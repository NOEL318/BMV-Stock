import { useQuery } from "@tanstack/react-query";

import type { PaperPortfolioState } from "@/application/paper-trading/getPaperPortfolio";

/**
 * Hook que consulta GET /api/paper-trading. Cachea con TanStack Query.
 * Si el server regresa 404, regresa null (el usuario no tiene portfolio aún).
 */
export function usePaperPortfolio() {
  return useQuery<PaperPortfolioState | null>({
    queryKey: ["paper-portfolio"],
    queryFn: async () => {
      const res = await fetch("/api/paper-trading");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("failed to fetch paper portfolio");
      return res.json() as Promise<PaperPortfolioState>;
    },
  });
}
