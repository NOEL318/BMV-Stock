import { describe, expect, it } from "vitest";

import { computePortfolioMetrics } from "./computePortfolioMetrics";
import type { HoldingWithQuote } from "./getHoldings";

/** Helper para construir un HoldingWithQuote mínimo para los tests. */
function holding(cost: number, market: number | null): HoldingWithQuote {
  return {
    holding: {} as never,
    quote: null,
    costBasisMxn: cost,
    marketValueMxn: market,
    unrealizedPnLMxn: market !== null ? market - cost : null,
    unrealizedPnLPercent: market !== null && cost > 0 ? (market - cost) / cost : null,
  };
}

describe("computePortfolioMetrics", () => {
  it("suma cost y market correctamente", () => {
    const m = computePortfolioMetrics([holding(1000, 1100), holding(500, 600)]);
    expect(m.totalCostBasisMxn).toBe(1500);
    expect(m.totalMarketValueMxn).toBe(1700);
    expect(m.totalUnrealizedPnLMxn).toBe(200);
    expect(m.totalUnrealizedPnLPercent).toBeCloseTo(0.1333, 4);
    expect(m.countWithQuote).toBe(2);
    expect(m.countMissingQuote).toBe(0);
  });

  it("cuenta holdings sin quote sin sumarlos a market", () => {
    const m = computePortfolioMetrics([holding(1000, 1100), holding(500, null)]);
    expect(m.totalCostBasisMxn).toBe(1500);
    expect(m.totalMarketValueMxn).toBe(1100);
    expect(m.countMissingQuote).toBe(1);
  });

  it("regresa pct=0 cuando cost basis es 0", () => {
    const m = computePortfolioMetrics([]);
    expect(m.totalUnrealizedPnLPercent).toBe(0);
  });
});
