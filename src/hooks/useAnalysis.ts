import { useQuery } from "@tanstack/react-query";

import type { MACDResult } from "@/application/analysis/computeIndicators";
import type { HistoricalPrice, TimeRange } from "@/domain/entities/HistoricalPrice";
import type { Quote } from "@/domain/entities/Quote";

/** Respuesta del endpoint GET /api/analysis/[ticker]. */
interface AnalysisResponse {
  quote: Quote;
  historical: HistoricalPrice[];
  indicators: {
    sma20: (number | null)[];
    sma50: (number | null)[];
    rsi14: (number | null)[];
    macd: MACDResult;
  };
}

/**
 * Hook que consulta GET /api/analysis/[ticker]?range=...
 * Solo se activa cuando `ticker` tiene al menos un carácter.
 *
 * @param ticker - Símbolo de la emisora (p.ej. "AMXL.MX", "AAPL")
 * @param range  - Rango temporal; default "3M"
 */
export function useAnalysis(ticker: string, range: TimeRange = "3M") {
  return useQuery<AnalysisResponse>({
    queryKey: ["analysis", ticker, range],
    queryFn: async () => {
      const res = await fetch(`/api/analysis/${encodeURIComponent(ticker)}?range=${range}`);
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => ({}));
        const msg =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof (body as Record<string, unknown>).error === "string"
            ? (body as Record<string, unknown>).error
            : "failed to fetch analysis";
        throw new Error(msg as string);
      }
      return res.json() as Promise<AnalysisResponse>;
    },
    enabled: ticker.length > 0,
    // Refrescar cada 30s mientras la pestaña esté activa, para que
    // los precios y la gráfica se mantengan casi en vivo.
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}
