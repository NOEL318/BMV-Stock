import { describe, expect, it, vi } from "vitest";

import type { Holding } from "@/domain/entities/Holding";
import type { PaperPortfolio } from "@/domain/entities/PaperPortfolio";
import type { Quote } from "@/domain/entities/Quote";
import type { Trade } from "@/domain/entities/Trade";
import type { WatchlistItem } from "@/domain/entities/WatchlistItem";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";
import type { MarketDataProvider, MarketSnapshot } from "@/domain/ports/MarketDataProvider";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";
import type { PaperPositionRepository } from "@/domain/ports/PaperPositionRepository";
import type { TradeRepository } from "@/domain/ports/TradeRepository";
import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";

import { getDashboardData } from "./getDashboardData";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const snapshot: MarketSnapshot = {
  ipc: {
    ticker: "IPC",
    exchange: "BMV",
    priceMxn: 54_000,
    priceUsd: null,
    openMxn: 53_800,
    highMxn: 54_100,
    lowMxn: 53_700,
    volume: 200_000_000,
    asOf: new Date(),
  },
  usdMxn: {
    ticker: "USDMXN",
    exchange: "SIC",
    priceMxn: 17.5,
    priceUsd: 1,
    openMxn: 17.48,
    highMxn: 17.52,
    lowMxn: 17.45,
    volume: 0,
    asOf: new Date(),
  },
  sp500: {
    ticker: "SPX",
    exchange: "SIC",
    priceMxn: 88_000,
    priceUsd: 5_030,
    openMxn: 87_500,
    highMxn: 88_200,
    lowMxn: 87_000,
    volume: 0,
    asOf: new Date(),
  },
  nasdaq: {
    ticker: "IXIC",
    exchange: "SIC",
    priceMxn: 300_000,
    priceUsd: 17_143,
    openMxn: 299_000,
    highMxn: 301_000,
    lowMxn: 298_000,
    volume: 0,
    asOf: new Date(),
  },
};

const holding: Holding = {
  id: "h1",
  userId: "u1",
  ticker: "WALMEX",
  exchange: "BMV",
  quantity: 100,
  avgCostMxn: 70,
  openedAt: new Date(),
  closedAt: null,
  notes: null,
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
  volume: 500_000,
  asOf: new Date(),
};

const paperPortfolio: PaperPortfolio = {
  id: "pp1",
  userId: "u1",
  name: "Simulación",
  cashBalanceMxn: 95_000,
  initialBalanceMxn: 100_000,
  createdAt: new Date(),
  resetAt: null,
};

const watchlistItem: WatchlistItem = {
  id: "wl1",
  userId: "u1",
  ticker: "AAPL",
  exchange: "SIC",
  alertPriceAbove: null,
  alertPriceBelow: null,
  notes: null,
  addedAt: new Date(),
};

const trade: Trade = {
  id: "t1",
  userId: "u1",
  ticker: "WALMEX",
  exchange: "BMV",
  action: "BUY",
  quantity: 100,
  priceMxn: 70,
  commissionMxn: 0,
  executedAt: new Date(),
  notes: null,
  createdAt: new Date(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getDashboardData", () => {
  it("regresa la estructura completa cuando todos los repos responden OK", async () => {
    const holdingRepo: HoldingRepository = {
      listByUser: vi.fn().mockResolvedValue([holding]),
      findById: vi.fn(),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    const tradeRepo: TradeRepository = {
      listByUser: vi.fn().mockResolvedValue([trade]),
      findById: vi.fn(),
      create: vi.fn(),
    };
    const paperPortfolioRepo: PaperPortfolioRepository = {
      findByUser: vi.fn().mockResolvedValue(paperPortfolio),
      create: vi.fn(),
      update: vi.fn(),
      reset: vi.fn(),
    };
    const paperPositionRepo: PaperPositionRepository = {
      listByPortfolio: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    const watchlistRepo: WatchlistRepository = {
      listByUser: vi.fn().mockResolvedValue([watchlistItem]),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const marketData: MarketDataProvider = {
      getQuote: vi.fn().mockResolvedValue(quote),
      getHistorical: vi.fn(),
      getMarketSnapshot: vi.fn().mockResolvedValue(snapshot),
    };

    const result = await getDashboardData({
      userId: "u1",
      holdingRepo,
      tradeRepo,
      paperPortfolioRepo,
      paperPositionRepo,
      watchlistRepo,
      marketData,
    });

    // Snapshot de mercado presente.
    expect(result.marketSnapshot).toEqual(snapshot);

    // Holdings y métricas de portafolio.
    expect(result.portfolio.holdings).toHaveLength(1);
    expect(result.portfolio.holdings[0]!.holding).toEqual(holding);
    expect(result.portfolio.metrics.totalCostBasisMxn).toBe(7_000);
    expect(result.portfolio.metrics.totalMarketValueMxn).toBe(7_500);

    // Paper portfolio presente (sin posiciones → equity = solo cash).
    expect(result.paperPortfolio).not.toBeNull();
    expect(result.paperPortfolio!.portfolio).toEqual(paperPortfolio);
    expect(result.paperPortfolio!.totalEquityMxn).toBe(95_000);

    // Watchlist con quote tolerada.
    expect(result.watchlist).toHaveLength(1);
    expect(result.watchlist[0]!.item).toEqual(watchlistItem);

    // Últimos trades (máximo 10).
    expect(result.recentTrades).toHaveLength(1);
    expect(result.recentTrades[0]).toEqual(trade);
  });
});
