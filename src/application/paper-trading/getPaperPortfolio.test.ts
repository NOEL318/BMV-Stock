import { describe, expect, it, vi } from "vitest";

import type { PaperPortfolio } from "@/domain/entities/PaperPortfolio";
import type { PaperPosition } from "@/domain/entities/PaperPosition";
import type { Quote } from "@/domain/entities/Quote";
import { TickerNotFoundError } from "@/domain/errors/DomainError";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";
import type { PaperPositionRepository } from "@/domain/ports/PaperPositionRepository";

import { getPaperPortfolio } from "./getPaperPortfolio";

const portfolio: PaperPortfolio = {
  id: "pp1",
  userId: "u1",
  name: "Mi paper",
  cashBalanceMxn: 90_000,
  initialBalanceMxn: 100_000,
  createdAt: new Date(),
  resetAt: null,
};

const position: PaperPosition = {
  id: "pos1",
  paperPortfolioId: "pp1",
  ticker: "WALMEX",
  exchange: "BMV",
  quantity: 100,
  avgCostMxn: 70,
  openedAt: new Date(),
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const quote: Quote = {
  ticker: "WALMEX",
  exchange: "BMV",
  priceMxn: 75,
  priceUsd: null,
  openMxn: 74,
  highMxn: 76,
  lowMxn: 73,
  volume: 1_000_000,
  asOf: new Date(),
};

describe("getPaperPortfolio", () => {
  it("regresa estado completo cuando existe portfolio con posiciones", async () => {
    const portfolioRepo: PaperPortfolioRepository = {
      findByUser: vi.fn().mockResolvedValue(portfolio),
      create: vi.fn(),
      update: vi.fn(),
      reset: vi.fn(),
    };
    const positionRepo: PaperPositionRepository = {
      listByPortfolio: vi.fn().mockResolvedValue([position]),
      findById: vi.fn(),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    const marketData: MarketDataProvider = {
      getQuote: vi.fn().mockResolvedValue(quote),
      getHistorical: vi.fn(),
      getMarketSnapshot: vi.fn(),
    };

    const result = await getPaperPortfolio({
      userId: "u1",
      paperPortfolioRepo: portfolioRepo,
      paperPositionRepo: positionRepo,
      marketData,
    });

    expect(result).not.toBeNull();
    expect(result!.portfolio).toEqual(portfolio);
    expect(result!.positions).toHaveLength(1);
    const p = result!.positions[0]!;
    expect(p.costBasisMxn).toBe(7000);
    expect(p.marketValueMxn).toBe(7500);
    // equity = cash + market = 90_000 + 7_500 = 97_500
    expect(result!.totalEquityMxn).toBe(97_500);
    // retorno = 97_500 - 100_000 = -2_500
    expect(result!.totalReturnMxn).toBe(-2_500);
    expect(result!.totalReturnPercent).toBeCloseTo(-0.025, 4);
  });

  it("regresa null cuando el usuario no tiene paper portfolio", async () => {
    const portfolioRepo: PaperPortfolioRepository = {
      findByUser: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      reset: vi.fn(),
    };
    const positionRepo: PaperPositionRepository = {
      listByPortfolio: vi.fn(),
      findById: vi.fn(),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    const marketData: MarketDataProvider = {
      getQuote: vi.fn(),
      getHistorical: vi.fn(),
      getMarketSnapshot: vi.fn(),
    };

    const result = await getPaperPortfolio({
      userId: "u1",
      paperPortfolioRepo: portfolioRepo,
      paperPositionRepo: positionRepo,
      marketData,
    });
    expect(result).toBeNull();
  });

  it("tolera fallo de quote individual en posición", async () => {
    const portfolioRepo: PaperPortfolioRepository = {
      findByUser: vi.fn().mockResolvedValue(portfolio),
      create: vi.fn(),
      update: vi.fn(),
      reset: vi.fn(),
    };
    const positionRepo: PaperPositionRepository = {
      listByPortfolio: vi.fn().mockResolvedValue([position]),
      findById: vi.fn(),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    const marketData: MarketDataProvider = {
      getQuote: vi.fn().mockRejectedValue(new TickerNotFoundError("WALMEX")),
      getHistorical: vi.fn(),
      getMarketSnapshot: vi.fn(),
    };

    const result = await getPaperPortfolio({
      userId: "u1",
      paperPortfolioRepo: portfolioRepo,
      paperPositionRepo: positionRepo,
      marketData,
    });
    expect(result).not.toBeNull();
    expect(result!.positions[0]!.quote).toBeNull();
    expect(result!.positions[0]!.marketValueMxn).toBeNull();
    // Equity = solo cash cuando no hay quote
    expect(result!.totalEquityMxn).toBe(90_000);
  });
});
