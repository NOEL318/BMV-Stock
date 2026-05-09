import type { Holding } from "@/domain/entities/Holding";
import type { Quote } from "@/domain/entities/Quote";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import { Ticker } from "@/domain/value-objects/Ticker";

/**
 * Holding enriquecido con su cotización actual y P&L sin realizar.
 */
export interface HoldingWithQuote {
  holding: Holding;
  quote: Quote | null;
  /** Valor de mercado en MXN (quantity * priceMxn). null si no hay quote. */
  marketValueMxn: number | null;
  /** Costo total invertido (quantity * avgCostMxn). */
  costBasisMxn: number;
  /** P&L sin realizar en MXN. null si no hay quote. */
  unrealizedPnLMxn: number | null;
  /** P&L sin realizar en porcentaje (0 a 1). null si no hay quote. */
  unrealizedPnLPercent: number | null;
}

/** Argumentos del use case. */
export interface GetHoldingsArgs {
  userId: string;
  holdingRepo: HoldingRepository;
  marketData: MarketDataProvider;
}

/**
 * Construye un `Ticker` desde el par (symbol, exchange) que vienen del
 * holding (el cual solo guarda strings, no el value object).
 */
function toTicker(symbol: string, exchange: "BMV" | "SIC"): Ticker {
  return Ticker.parse(exchange === "BMV" ? `${symbol}.MX` : symbol);
}

/**
 * Lista los holdings activos del usuario, cada uno con su cotización actual
 * y P&L calculado. Si una cotización falla (ticker no encontrado, mercado
 * caído), el holding se incluye con `quote: null` y P&L null — la UI debe
 * mostrar "sin datos" en lugar de fingir números.
 */
export async function getHoldings({
  userId,
  holdingRepo,
  marketData,
}: GetHoldingsArgs): Promise<HoldingWithQuote[]> {
  const holdings = await holdingRepo.listByUser(userId);
  return Promise.all(
    holdings.map(async (h) => {
      const ticker = toTicker(h.ticker, h.exchange);
      let quote: Quote | null = null;
      try {
        quote = await marketData.getQuote(ticker);
      } catch {
        // Tolerar fallos individuales — un ticker caído no rompe toda la lista.
      }
      const costBasisMxn = h.quantity * h.avgCostMxn;
      const marketValueMxn = quote ? h.quantity * quote.priceMxn : null;
      const unrealizedPnLMxn = marketValueMxn !== null ? marketValueMxn - costBasisMxn : null;
      const unrealizedPnLPercent =
        unrealizedPnLMxn !== null && costBasisMxn > 0 ? unrealizedPnLMxn / costBasisMxn : null;
      return {
        holding: h,
        quote,
        marketValueMxn,
        costBasisMxn,
        unrealizedPnLMxn,
        unrealizedPnLPercent,
      };
    }),
  );
}
