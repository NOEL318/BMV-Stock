import type { HistoricalPrice, TimeRange } from "../entities/HistoricalPrice";
import type { Quote } from "../entities/Quote";
import type { Ticker } from "../value-objects/Ticker";

/**
 * Snapshot del mercado: cotizaciones agregadas para los benchmarks que
 * mostramos en el dashboard (IPC, USDMXN, S&P 500, NASDAQ).
 */
export interface MarketSnapshot {
  ipc: Quote;
  usdMxn: Quote;
  sp500: Quote;
  nasdaq: Quote;
}

/**
 * Puerto para obtener datos de mercado.
 * Implementaciones esperadas:
 * - `YahooMarketDataProvider` (infra) usa la librería yahoo-finance2.
 * - `CachedMarketDataProvider` (infra) decora otra implementación con cache en DB.
 */
export interface MarketDataProvider {
  getQuote(ticker: Ticker): Promise<Quote>;
  getHistorical(ticker: Ticker, range: TimeRange): Promise<HistoricalPrice[]>;
  getMarketSnapshot(): Promise<MarketSnapshot>;
}
