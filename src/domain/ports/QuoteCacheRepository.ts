import type { HistoricalPrice } from "../entities/HistoricalPrice";
import type { Quote } from "../entities/Quote";
import type { Exchange } from "../value-objects/Ticker";

/**
 * Quote cacheado junto con su metadata de cache.
 */
export interface CachedQuote {
  quote: Quote;
  /**
   * Hora real en que se escribió el quote en cache. Es la referencia correcta
   * para calcular frescura/TTL (a diferencia de `quote.asOf`, que es la hora de
   * mercado según Yahoo y puede traer 15-20 min de retraso).
   */
  fetchedAt: Date;
}

/**
 * Persistencia del cache de cotizaciones (quote_cache + historical_price).
 * El TTL lógico lo enforza el CachedMarketDataProvider, no este repo.
 */
export interface QuoteCacheRepository {
  /**
   * Busca el último quote cacheado con su `fetchedAt`. Regresa null si no existe.
   */
  findCached(ticker: string, exchange: Exchange): Promise<CachedQuote | null>;
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
