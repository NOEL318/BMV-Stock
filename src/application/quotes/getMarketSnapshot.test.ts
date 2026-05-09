import { describe, expect, it, vi } from "vitest";

import type { MarketDataProvider, MarketSnapshot } from "@/domain/ports/MarketDataProvider";

import { getMarketSnapshot } from "./getMarketSnapshot";

describe("getMarketSnapshot", () => {
  it("delega al provider y regresa el snapshot completo", async () => {
    const fixture: MarketSnapshot = {
      ipc: {
        ticker: "IPC",
        exchange: "BMV",
        priceMxn: 55_000,
        priceUsd: null,
        openMxn: 54_500,
        highMxn: 55_200,
        lowMxn: 54_300,
        volume: 0,
        asOf: new Date(),
      },
      usdMxn: {
        ticker: "USDMXN",
        exchange: "SIC",
        priceMxn: 17.5,
        priceUsd: null,
        openMxn: 17.4,
        highMxn: 17.6,
        lowMxn: 17.35,
        volume: 0,
        asOf: new Date(),
      },
      sp500: {
        ticker: "SPX",
        exchange: "SIC",
        priceMxn: 80_000,
        priceUsd: 4_700,
        openMxn: 79_500,
        highMxn: 80_200,
        lowMxn: 79_300,
        volume: 0,
        asOf: new Date(),
      },
      nasdaq: {
        ticker: "IXIC",
        exchange: "SIC",
        priceMxn: 250_000,
        priceUsd: 14_700,
        openMxn: 248_000,
        highMxn: 252_000,
        lowMxn: 247_000,
        volume: 0,
        asOf: new Date(),
      },
    };
    const provider: MarketDataProvider = {
      getQuote: vi.fn(),
      getHistorical: vi.fn(),
      getMarketSnapshot: vi.fn().mockResolvedValue(fixture),
    };
    const result = await getMarketSnapshot({ provider });
    expect(result).toBe(fixture);
  });
});
