import type { HoldingWithQuote } from "./getHoldings";

/**
 * Métricas agregadas del portafolio entero.
 */
export interface PortfolioMetrics {
  totalCostBasisMxn: number;
  totalMarketValueMxn: number;
  totalUnrealizedPnLMxn: number;
  totalUnrealizedPnLPercent: number;
  /** Cantidad de holdings con quote disponible. */
  countWithQuote: number;
  /** Cantidad de holdings sin quote (no se incluyen en marketValue). */
  countMissingQuote: number;
}

/**
 * Suma los valores de mercado, cost basis y P&L de todos los holdings.
 * Holdings sin quote disponible no contribuyen al market value (se reflejan
 * en `countMissingQuote`).
 */
export function computePortfolioMetrics(holdings: HoldingWithQuote[]): PortfolioMetrics {
  let totalCost = 0;
  let totalMarket = 0;
  let countWithQuote = 0;
  let countMissingQuote = 0;
  for (const h of holdings) {
    totalCost += h.costBasisMxn;
    if (h.marketValueMxn !== null) {
      totalMarket += h.marketValueMxn;
      countWithQuote += 1;
    } else {
      countMissingQuote += 1;
    }
  }
  const totalPnL = totalMarket - totalCost;
  const totalPnLPercent = totalCost > 0 ? totalPnL / totalCost : 0;
  return {
    totalCostBasisMxn: totalCost,
    totalMarketValueMxn: totalMarket,
    totalUnrealizedPnLMxn: totalPnL,
    totalUnrealizedPnLPercent: totalPnLPercent,
    countWithQuote,
    countMissingQuote,
  };
}
