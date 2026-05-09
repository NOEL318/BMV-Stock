import { describe, expect, it, vi } from "vitest";

import type { HistoricalPrice } from "@/domain/entities/HistoricalPrice";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";

import { getHistoricalPrices } from "./getHistoricalPrices";

describe("getHistoricalPrices", () => {
  it("delega al provider con el ticker parseado y rango", async () => {
    const fixture: HistoricalPrice[] = [
      {
        ticker: "WALMEX",
        exchange: "BMV",
        date: new Date("2026-01-15"),
        open: 68,
        high: 70,
        low: 67,
        close: 69.42,
        volume: 1_000_000,
      },
    ];
    const provider: MarketDataProvider = {
      getQuote: vi.fn(),
      getHistorical: vi.fn().mockResolvedValue(fixture),
      getMarketSnapshot: vi.fn(),
    };
    const result = await getHistoricalPrices({
      provider,
      rawTicker: "walmex.mx",
      range: "3M",
    });
    expect(result).toBe(fixture);
    expect(provider.getHistorical).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: "WALMEX", exchange: "BMV" }),
      "3M",
    );
  });
});
