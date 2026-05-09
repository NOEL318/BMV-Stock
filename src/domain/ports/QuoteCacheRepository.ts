import type { HistoricalPrice } from "../entities/HistoricalPrice";
import type { Quote } from "../entities/Quote";
import type { Exchange } from "../value-objects/Ticker";

/**
 * Persistencia del cache de cotizaciones (quote_cache + historical_price).
 * El TTL lógico de 10 min lo enforza el CachedMarketDataProvider, no este repo.
 */
export interface QuoteCacheRepository {
  /** Busca el último quote cacheado. Regresa null si no existe. */
  find(ticker: string, exchange: Exchange): Promise<Quote | null>;
  /** Inserta o actualiza el quote en cache (key: ticker + exchange). */
  upsert(quote: Quote): Promise<void>;
  /** Lista los precios históricos cacheados en un rango de fechas. */
  findHistorical(
    ticker: string,
    exchange: Exchange,
    fromDate: Date,
    toDate: Date,
  ): Promise<HistoricalPrice[]>;
  /**
   * Inserta múltiples días de OHLCV en cache. Si una fecha ya existe,
   * conserva el dato existente (onConflictDoNothing).
   */
  upsertHistorical(prices: HistoricalPrice[]): Promise<void>;
}
