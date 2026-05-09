import { describe, expect, it, vi } from "vitest";

import type { Holding } from "@/domain/entities/Holding";
import type { Quote } from "@/domain/entities/Quote";
import { TickerNotFoundError } from "@/domain/errors/DomainError";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";

import { getHoldings } from "./getHoldings";

const holding1: Holding = {
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

const quote1: Quote = {
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

describe("getHoldings", () => {
  it("regresa holdings enriquecidos con quote y P&L", async () => {
    const holdingRepo: HoldingRepository = {
      listByUser: vi.fn().mockResolvedValue([holding1]),
      findById: vi.fn(),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    const marketData: MarketDataProvider = {
      getQuote: vi.fn().mockResolvedValue(quote1),
      getHistorical: vi.fn(),
      getMarketSnapshot: vi.fn(),
    };
    const result = await getHoldings({ userId: "u1", holdingRepo, marketData });
    expect(result).toHaveLength(1);
    const r = result[0]!;
    expect(r.holding).toEqual(holding1);
    expect(r.quote).toEqual(quote1);
    expect(r.costBasisMxn).toBe(7000);
    expect(r.marketValueMxn).toBe(7500);
    expect(r.unrealizedPnLMxn).toBe(500);
    expect(r.unrealizedPnLPercent).toBeCloseTo(0.0714, 4);
  });

  it("tolera fallo de quote individual y regresa null", async () => {
    const holdingRepo: HoldingRepository = {
      listByUser: vi.fn().mockResolvedValue([holding1]),
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
    const result = await getHoldings({ userId: "u1", holdingRepo, marketData });
    expect(result[0]!.quote).toBeNull();
    expect(result[0]!.marketValueMxn).toBeNull();
    expect(result[0]!.unrealizedPnLMxn).toBeNull();
  });
});
