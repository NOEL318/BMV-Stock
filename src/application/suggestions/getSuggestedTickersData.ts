import type { Quote } from "@/domain/entities/Quote";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import { Ticker } from "@/domain/value-objects/Ticker";
import { SUGGESTED_TICKERS } from "@/lib/suggested-tickers";

/**
 * Item de la lista de sugerencias enriquecido con cotización actual y
 * cierres del último mes para dibujar una sparkline.
 *
 * Si el quote o el histórico fallan (Yahoo caído, ticker poco líquido),
 * los valores son null/[] respectivamente — la UI muestra "sin datos".
 */
export interface SuggestedTickerData {
  ticker: string;
  exchange: "BMV" | "SIC";
  href: string;
  quote: Quote | null;
  recentCloses: number[];
}

/**
 * Para cada ticker sugerido (lista estática en `lib/suggested-tickers.ts`),
 * pide en paralelo el quote actual y los cierres del último mes. Tolera
 * fallos individuales por ticker.
 *
 * Llama 2 endpoints de Yahoo por ticker × 16 tickers = ~32 calls. La cache
 * (TTL 60s para quotes, persistente por fecha para históricos) absorbe la
 * mayoría de re-visitas — la primera carga puede tardar 1-2s.
 */
export async function getSuggestedTickersData({
  marketData,
}: {
  marketData: MarketDataProvider;
}): Promise<SuggestedTickerData[]> {
  return Promise.all(
    SUGGESTED_TICKERS.map(async (s) => {
      const ticker = Ticker.parse(s.exchange === "BMV" ? `${s.ticker}.MX` : s.ticker);
      const [quoteResult, historicalResult] = await Promise.allSettled([
        marketData.getQuote(ticker),
        marketData.getHistorical(ticker, "1M"),
      ]);
      const quote = quoteResult.status === "fulfilled" ? quoteResult.value : null;
      // Tolerar contratos rotos del provider (e.g., undefined en mocks o
      // proveedores con bug): cualquier valor no-array degrada a [].
      const recentCloses =
        historicalResult.status === "fulfilled" && Array.isArray(historicalResult.value)
          ? historicalResult.value.map((h) => h.close)
          : [];
      return {
        ticker: s.ticker,
        exchange: s.exchange,
        href: s.href,
        quote,
        recentCloses,
      };
    }),
  );
}
