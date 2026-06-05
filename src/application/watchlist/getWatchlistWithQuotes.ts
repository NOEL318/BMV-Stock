import type { Quote } from "@/domain/entities/Quote";
import type { WatchlistItem } from "@/domain/entities/WatchlistItem";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";
import { Ticker } from "@/domain/value-objects/Ticker";

/**
 * Item del watchlist enriquecido con su cotización actual y los cierres
 * recientes (último mes) para dibujar una sparkline en la UI.
 *
 * Si la cotización no está disponible (ticker no encontrado, mercado caído),
 * `quote` es null y `recentCloses` es array vacío.
 */
export interface WatchlistEntry {
  item: WatchlistItem;
  quote: Quote | null;
  /** Precios de cierre del último mes en orden cronológico (cero o más). */
  recentCloses: number[];
}

/**
 * Lista los items del watchlist del usuario, cada uno enriquecido con su
 * cotización actual y la serie de cierres del último mes.
 *
 * Tolera fallos individuales: si una cotización o histórico lanza error
 * (ticker no encontrado, mercado caído), el entry se incluye con
 * `quote: null` y `recentCloses: []` en lugar de propagar el error.
 */
export async function getWatchlistWithQuotes({
  userId,
  repo,
  marketData,
}: {
  userId: string;
  repo: WatchlistRepository;
  marketData: MarketDataProvider;
}): Promise<WatchlistEntry[]> {
  const items = await repo.listByUser(userId);
  return Promise.all(
    items.map(async (item) => {
      const ticker = Ticker.parse(item.exchange === "BMV" ? `${item.ticker}.MX` : item.ticker);
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
      return { item, quote, recentCloses };
    }),
  );
}
