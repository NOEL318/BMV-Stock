import type { PaperPortfolio } from "@/domain/entities/PaperPortfolio";
import type { PaperPosition } from "@/domain/entities/PaperPosition";
import type { Quote } from "@/domain/entities/Quote";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";
import type { PaperPositionRepository } from "@/domain/ports/PaperPositionRepository";
import { Ticker } from "@/domain/value-objects/Ticker";

/** Posición de paper trading enriquecida con cotización actual y P&L. */
export interface PaperPositionWithQuote {
  position: PaperPosition;
  quote: Quote | null;
  costBasisMxn: number;
  marketValueMxn: number | null;
  unrealizedPnLMxn: number | null;
  unrealizedPnLPercent: number | null;
}

/** Estado completo del paper portfolio con métricas agregadas. */
export interface PaperPortfolioState {
  portfolio: PaperPortfolio;
  positions: PaperPositionWithQuote[];
  /** Suma de cash + market value de todas las posiciones con quote. */
  totalEquityMxn: number;
  /** Diferencia entre totalEquity actual y initialBalance. */
  totalReturnMxn: number;
  /** Retorno como porcentaje (0 a 1) sobre el initialBalance. */
  totalReturnPercent: number;
}

/** Argumentos del use case. */
export interface GetPaperPortfolioArgs {
  userId: string;
  paperPortfolioRepo: PaperPortfolioRepository;
  paperPositionRepo: PaperPositionRepository;
  marketData: MarketDataProvider;
}

/**
 * Obtiene el estado completo del paper portfolio: portfolio + posiciones
 * con cotización + métricas agregadas (equity total, retorno).
 * Retorna null si el usuario aún no tiene paper portfolio.
 */
export async function getPaperPortfolio({
  userId,
  paperPortfolioRepo,
  paperPositionRepo,
  marketData,
}: GetPaperPortfolioArgs): Promise<PaperPortfolioState | null> {
  const portfolio = await paperPortfolioRepo.findByUser(userId);
  if (!portfolio) return null;

  const positions = await paperPositionRepo.listByPortfolio(portfolio.id);
  const enriched = await Promise.all(
    positions.map(async (p) => {
      const ticker = Ticker.parse(p.exchange === "BMV" ? `${p.ticker}.MX` : p.ticker);
      let quote: Quote | null = null;
      try {
        quote = await marketData.getQuote(ticker);
      } catch {
        // Tolerar fallos individuales.
      }
      const costBasisMxn = p.quantity * p.avgCostMxn;
      const marketValueMxn = quote ? p.quantity * quote.priceMxn : null;
      const unrealizedPnLMxn = marketValueMxn !== null ? marketValueMxn - costBasisMxn : null;
      const unrealizedPnLPercent =
        unrealizedPnLMxn !== null && costBasisMxn > 0 ? unrealizedPnLMxn / costBasisMxn : null;
      return {
        position: p,
        quote,
        costBasisMxn,
        marketValueMxn,
        unrealizedPnLMxn,
        unrealizedPnLPercent,
      };
    }),
  );

  const totalMarketValue = enriched.reduce((sum, e) => sum + (e.marketValueMxn ?? 0), 0);
  const totalEquity = portfolio.cashBalanceMxn + totalMarketValue;
  const totalReturn = totalEquity - portfolio.initialBalanceMxn;
  const totalReturnPercent =
    portfolio.initialBalanceMxn > 0 ? totalReturn / portfolio.initialBalanceMxn : 0;

  return {
    portfolio,
    positions: enriched,
    totalEquityMxn: totalEquity,
    totalReturnMxn: totalReturn,
    totalReturnPercent,
  };
}
