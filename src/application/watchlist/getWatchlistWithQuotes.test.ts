import { describe, expect, it, vi } from "vitest";

import type { Quote } from "@/domain/entities/Quote";
import type { WatchlistItem } from "@/domain/entities/WatchlistItem";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";

import { getWatchlistWithQuotes } from "./getWatchlistWithQuotes";

/** Item de muestra en BMV. */
const item1: WatchlistItem = {
  id: "wl1",
  userId: "u1",
  ticker: "WALMEX",
  exchange: "BMV",
  alertPriceAbove: null,
  alertPriceBelow: null,
  notes: null,
  addedAt: new Date(),
};

/** Cotización de muestra para WALMEX. */
const quote1: Quote = {
  ticker: "WALMEX",
  exchange: "BMV",
  priceMxn: 80,
  priceUsd: null,
  openMxn: 79,
  highMxn: 81,
  lowMxn: 78,
  volume: 500_000,
  asOf: new Date(),
};

describe("getWatchlistWithQuotes", () => {
  it("regresa los items con su quote cuando la cotización está disponible", async () => {
    const repo: WatchlistRepository = {
      listByUser: vi.fn().mockResolvedValue([item1]),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const marketData: MarketDataProvider = {
      getQuote: vi.fn().mockResolvedValue(quote1),
      getHistorical: vi.fn(),
      getMarketSnapshot: vi.fn(),
    };
    const result = await getWatchlistWithQuotes({ userId: "u1", repo, marketData });
    expect(result).toHaveLength(1);
    expect(result[0]!.item).toEqual(item1);
    expect(result[0]!.quote).toEqual(quote1);
    // Verifica que se llamó con el ticker BMV correcto.
    expect(marketData.getQuote).toHaveBeenCalledOnce();
  });

  it("regresa quote: null cuando la cotización lanza error (tolerancia a fallos)", async () => {
    const repo: WatchlistRepository = {
      listByUser: vi.fn().mockResolvedValue([item1]),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const marketData: MarketDataProvider = {
      getQuote: vi.fn().mockRejectedValue(new Error("mercado caído")),
      getHistorical: vi.fn(),
      getMarketSnapshot: vi.fn(),
    };
    const result = await getWatchlistWithQuotes({ userId: "u1", repo, marketData });
    expect(result).toHaveLength(1);
    expect(result[0]!.item).toEqual(item1);
    expect(result[0]!.quote).toBeNull();
  });
});
