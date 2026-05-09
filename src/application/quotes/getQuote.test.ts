import { describe, expect, it, vi } from "vitest";

import type { Quote } from "@/domain/entities/Quote";
import { TickerNotFoundError } from "@/domain/errors/DomainError";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";

import { getQuote } from "./getQuote";

function makeProvider(overrides: Partial<MarketDataProvider> = {}): MarketDataProvider {
  return {
    getQuote: vi.fn(),
    getHistorical: vi.fn(),
    getMarketSnapshot: vi.fn(),
    ...overrides,
  };
}

describe("getQuote", () => {
  it("regresa quote para un ticker BMV válido", async () => {
    const expected: Quote = {
      ticker: "WALMEX",
      exchange: "BMV",
      priceMxn: 69.42,
      priceUsd: null,
      openMxn: 68,
      highMxn: 70,
      lowMxn: 67.5,
      volume: 1_000_000,
      asOf: new Date("2026-01-15T16:00:00Z"),
    };
    const provider = makeProvider({ getQuote: vi.fn().mockResolvedValue(expected) });
    const result = await getQuote({ provider, rawTicker: "WALMEX.MX" });
    expect(result).toEqual(expected);
  });

  it("acepta ticker en minúsculas", async () => {
    const provider = makeProvider({
      getQuote: vi.fn().mockResolvedValue({
        ticker: "AAPL",
        exchange: "SIC",
        priceMxn: 3500,
        priceUsd: 200,
        openMxn: 3450,
        highMxn: 3550,
        lowMxn: 3400,
        volume: 50_000_000,
        asOf: new Date(),
      } as Quote),
    });
    const result = await getQuote({ provider, rawTicker: "aapl" });
    expect(result.ticker).toBe("AAPL");
  });

  it("propaga TickerNotFoundError del provider", async () => {
    const provider = makeProvider({
      getQuote: vi.fn().mockRejectedValue(new TickerNotFoundError("XXX")),
    });
    await expect(getQuote({ provider, rawTicker: "XXX" })).rejects.toThrow(TickerNotFoundError);
  });

  it("lanza error si el ticker tiene formato inválido", async () => {
    const provider = makeProvider();
    await expect(getQuote({ provider, rawTicker: "WAL!MEX" })).rejects.toThrow(/invalid/i);
    expect(provider.getQuote).not.toHaveBeenCalled();
  });
});
