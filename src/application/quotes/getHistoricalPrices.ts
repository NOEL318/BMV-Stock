import type { HistoricalPrice, TimeRange } from "@/domain/entities/HistoricalPrice";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import { Ticker } from "@/domain/value-objects/Ticker";

/**
 * Argumentos del use case getHistoricalPrices.
 */
export interface GetHistoricalPricesInput {
  provider: MarketDataProvider;
  rawTicker: string;
  range: TimeRange;
}

/**
 * Obtiene la serie histórica OHLCV de una emisora para un rango temporal.
 * Valida y normaliza el ticker antes de delegar.
 */
export async function getHistoricalPrices({
  provider,
  rawTicker,
  range,
}: GetHistoricalPricesInput): Promise<HistoricalPrice[]> {
  const ticker = Ticker.parse(rawTicker);
  return provider.getHistorical(ticker, range);
}
