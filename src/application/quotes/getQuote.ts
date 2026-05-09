import type { Quote } from "@/domain/entities/Quote";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import { Ticker } from "@/domain/value-objects/Ticker";

/**
 * Argumentos del use case getQuote.
 */
export interface GetQuoteInput {
  provider: MarketDataProvider;
  rawTicker: string;
}

/**
 * Obtiene la cotización actual de una emisora.
 * - Valida y normaliza el ticker vía `Ticker.parse`.
 * - Delega al provider (que puede ser cached, yahoo, etc.).
 * - Errores de dominio se propagan tal cual.
 */
export async function getQuote({ provider, rawTicker }: GetQuoteInput): Promise<Quote> {
  const ticker = Ticker.parse(rawTicker);
  return provider.getQuote(ticker);
}
