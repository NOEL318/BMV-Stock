import { describe, expect, it, vi } from "vitest";

import type { PaperPortfolio } from "@/domain/entities/PaperPortfolio";
import type { PaperPosition } from "@/domain/entities/PaperPosition";
import { InsufficientFundsError, InsufficientQuantityError } from "@/domain/errors/DomainError";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";
import type { PaperPositionRepository } from "@/domain/ports/PaperPositionRepository";
import type { PaperTradeRepository } from "@/domain/ports/PaperTradeRepository";

import { executePaperTrade } from "./executePaperTrade";

const basePortfolio: PaperPortfolio = {
  id: "pp1",
  userId: "u1",
  name: "Mi paper",
  cashBalanceMxn: 100_000,
  initialBalanceMxn: 100_000,
  createdAt: new Date(),
  resetAt: null,
};

const basePosition: PaperPosition = {
  id: "pos1",
  paperPortfolioId: "pp1",
  ticker: "WALMEX",
  exchange: "BMV",
  quantity: 100,
  avgCostMxn: 70,
  openedAt: new Date("2026-01-01"),
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makePortfolioRepo(
  overrides: Partial<PaperPortfolioRepository> = {},
): PaperPortfolioRepository {
  return {
    findByUser: vi.fn().mockResolvedValue(basePortfolio),
    create: vi.fn(),
    update: vi.fn().mockImplementation(async (p) => p),
    reset: vi.fn(),
    ...overrides,
  };
}

function makePositionRepo(
  overrides: Partial<PaperPositionRepository> = {},
): PaperPositionRepository {
  return {
    listByPortfolio: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByTickerAndExchange: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async (p) => ({
      ...p,
      id: "newpos",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    update: vi.fn().mockImplementation(async (p) => p),
    ...overrides,
  };
}

function makeTradeRepo(overrides: Partial<PaperTradeRepository> = {}): PaperTradeRepository {
  return {
    listByPortfolio: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async (t) => ({ ...t, id: "t1", createdAt: new Date() })),
    ...overrides,
  };
}

function makeMarketData(price = 75): MarketDataProvider {
  return {
    getQuote: vi.fn().mockResolvedValue({
      ticker: "WALMEX",
      exchange: "BMV",
      priceMxn: price,
      priceUsd: null,
      openMxn: price,
      highMxn: price,
      lowMxn: price,
      volume: 1_000_000,
      asOf: new Date(),
    }),
    getHistorical: vi.fn(),
    getMarketSnapshot: vi.fn(),
  };
}

describe("executePaperTrade", () => {
  it("BUY exitoso sin posición previa crea position nueva", async () => {
    const portfolioRepo = makePortfolioRepo();
    const positionRepo = makePositionRepo();
    const tradeRepo = makeTradeRepo();
    const marketData = makeMarketData();

    const result = await executePaperTrade({
      input: {
        userId: "u1",
        ticker: "WALMEX",
        exchange: "BMV",
        action: "BUY",
        quantity: 10,
        priceMxn: 70,
        notes: null,
      },
      paperPortfolioRepo: portfolioRepo,
      paperPositionRepo: positionRepo,
      paperTradeRepo: tradeRepo,
      marketData,
    });

    expect(positionRepo.create).toHaveBeenCalledTimes(1);
    expect(positionRepo.update).not.toHaveBeenCalled();
    expect(result.portfolio.cashBalanceMxn).toBe(99_300); // 100_000 - 700
    expect(result.position.quantity).toBe(10);
  });

  it("BUY exitoso con posición previa recalcula avgCost", async () => {
    // Posición existente: 100 acciones a 70
    const portfolioRepo = makePortfolioRepo();
    const positionRepo = makePositionRepo({
      findByTickerAndExchange: vi.fn().mockResolvedValue(basePosition),
    });
    const tradeRepo = makeTradeRepo();
    const marketData = makeMarketData();

    const result = await executePaperTrade({
      input: {
        userId: "u1",
        ticker: "WALMEX",
        exchange: "BMV",
        action: "BUY",
        quantity: 50,
        priceMxn: 80,
        notes: null,
      },
      paperPortfolioRepo: portfolioRepo,
      paperPositionRepo: positionRepo,
      paperTradeRepo: tradeRepo,
      marketData,
    });

    expect(positionRepo.update).toHaveBeenCalledTimes(1);
    expect(positionRepo.create).not.toHaveBeenCalled();
    // avgCost = (100*70 + 50*80) / 150 = 11000/150
    expect(result.position.avgCostMxn).toBeCloseTo(73.3333, 3);
    expect(result.position.quantity).toBe(150);
    expect(result.portfolio.cashBalanceMxn).toBe(96_000); // 100_000 - 4_000
  });

  it("BUY sin fondos suficientes lanza InsufficientFundsError", async () => {
    const portfolioRepo = makePortfolioRepo({
      findByUser: vi.fn().mockResolvedValue({ ...basePortfolio, cashBalanceMxn: 500 }),
    });
    const positionRepo = makePositionRepo();
    const tradeRepo = makeTradeRepo();
    const marketData = makeMarketData();

    await expect(
      executePaperTrade({
        input: {
          userId: "u1",
          ticker: "WALMEX",
          exchange: "BMV",
          action: "BUY",
          quantity: 100,
          priceMxn: 70,
          notes: null,
        },
        paperPortfolioRepo: portfolioRepo,
        paperPositionRepo: positionRepo,
        paperTradeRepo: tradeRepo,
        marketData,
      }),
    ).rejects.toThrow(InsufficientFundsError);
  });

  it("SELL parcial reduce cantidad y aumenta cash", async () => {
    const portfolioRepo = makePortfolioRepo();
    const positionRepo = makePositionRepo({
      findByTickerAndExchange: vi.fn().mockResolvedValue(basePosition),
    });
    const tradeRepo = makeTradeRepo();
    const marketData = makeMarketData();

    const result = await executePaperTrade({
      input: {
        userId: "u1",
        ticker: "WALMEX",
        exchange: "BMV",
        action: "SELL",
        quantity: 30,
        priceMxn: 80,
        notes: null,
      },
      paperPortfolioRepo: portfolioRepo,
      paperPositionRepo: positionRepo,
      paperTradeRepo: tradeRepo,
      marketData,
    });

    expect(result.position.quantity).toBe(70);
    expect(result.portfolio.cashBalanceMxn).toBe(102_400); // 100_000 + 30*80
    expect(result.position.closedAt).toBeNull();
  });

  it("SELL total cierra la posición (closedAt no null)", async () => {
    const portfolioRepo = makePortfolioRepo();
    const positionRepo = makePositionRepo({
      findByTickerAndExchange: vi.fn().mockResolvedValue(basePosition),
    });
    const tradeRepo = makeTradeRepo();
    const marketData = makeMarketData();

    const result = await executePaperTrade({
      input: {
        userId: "u1",
        ticker: "WALMEX",
        exchange: "BMV",
        action: "SELL",
        quantity: 100,
        priceMxn: 75,
        notes: null,
      },
      paperPortfolioRepo: portfolioRepo,
      paperPositionRepo: positionRepo,
      paperTradeRepo: tradeRepo,
      marketData,
    });

    expect(result.position.quantity).toBe(0);
    expect(result.position.closedAt).not.toBeNull();
  });

  it("SELL excedente lanza InsufficientQuantityError", async () => {
    const portfolioRepo = makePortfolioRepo();
    const positionRepo = makePositionRepo({
      findByTickerAndExchange: vi.fn().mockResolvedValue(basePosition),
    });
    const tradeRepo = makeTradeRepo();
    const marketData = makeMarketData();

    await expect(
      executePaperTrade({
        input: {
          userId: "u1",
          ticker: "WALMEX",
          exchange: "BMV",
          action: "SELL",
          quantity: 200,
          priceMxn: 75,
          notes: null,
        },
        paperPortfolioRepo: portfolioRepo,
        paperPositionRepo: positionRepo,
        paperTradeRepo: tradeRepo,
        marketData,
      }),
    ).rejects.toThrow(InsufficientQuantityError);
  });

  it("sin paper portfolio lanza Error", async () => {
    const portfolioRepo = makePortfolioRepo({
      findByUser: vi.fn().mockResolvedValue(null),
    });
    const positionRepo = makePositionRepo();
    const tradeRepo = makeTradeRepo();
    const marketData = makeMarketData();

    await expect(
      executePaperTrade({
        input: {
          userId: "u1",
          ticker: "WALMEX",
          exchange: "BMV",
          action: "BUY",
          quantity: 10,
          priceMxn: 70,
          notes: null,
        },
        paperPortfolioRepo: portfolioRepo,
        paperPositionRepo: positionRepo,
        paperTradeRepo: tradeRepo,
        marketData,
      }),
    ).rejects.toThrow(/paper portfolio not found/i);
  });

  it("priceMxn null usa quote del provider", async () => {
    const portfolioRepo = makePortfolioRepo();
    const positionRepo = makePositionRepo();
    const tradeRepo = makeTradeRepo();
    // El provider devuelve precio 90
    const marketData = makeMarketData(90);

    const result = await executePaperTrade({
      input: {
        userId: "u1",
        ticker: "WALMEX",
        exchange: "BMV",
        action: "BUY",
        quantity: 10,
        priceMxn: null,
        notes: null,
      },
      paperPortfolioRepo: portfolioRepo,
      paperPositionRepo: positionRepo,
      paperTradeRepo: tradeRepo,
      marketData,
    });

    expect(marketData.getQuote).toHaveBeenCalledTimes(1);
    // cash = 100_000 - 10*90 = 99_100
    expect(result.portfolio.cashBalanceMxn).toBe(99_100);
  });
});
