import { describe, expect, it } from "vitest";

import {
  InsufficientFundsError,
  InsufficientQuantityError,
  InvalidTickerError,
  MarketDataUnavailableError,
  TickerNotFoundError,
  UnauthorizedError,
} from "./DomainError";

describe("DomainError subclasses", () => {
  it("InsufficientFundsError tiene code correcto y mensaje con valores", () => {
    const err = new InsufficientFundsError(5000, 3000);
    expect(err.code).toBe("INSUFFICIENT_FUNDS");
    expect(err.message).toMatch(/5000/);
    expect(err.message).toMatch(/3000/);
    expect(err).toBeInstanceOf(Error);
  });

  it("InsufficientQuantityError tiene code correcto y mensaje con valores", () => {
    const err = new InsufficientQuantityError(200, 100);
    expect(err.code).toBe("INSUFFICIENT_QUANTITY");
    expect(err.message).toMatch(/200/);
    expect(err.message).toMatch(/100/);
  });

  it("InvalidTickerError tiene code correcto y expone raw", () => {
    const err = new InvalidTickerError("WAL!MEX", "caracteres inválidos");
    expect(err.code).toBe("INVALID_TICKER");
    expect(err.raw).toBe("WAL!MEX");
    expect(err.message).toMatch(/WAL!MEX/);
  });

  it("TickerNotFoundError tiene code correcto y expone ticker", () => {
    const err = new TickerNotFoundError("XYZW");
    expect(err.code).toBe("TICKER_NOT_FOUND");
    expect(err.ticker).toBe("XYZW");
    expect(err.message).toMatch(/XYZW/);
  });

  it("MarketDataUnavailableError tiene code correcto y expone providerName", () => {
    const err = new MarketDataUnavailableError("YahooFinance", new Error("timeout"));
    expect(err.code).toBe("MARKET_DATA_UNAVAILABLE");
    expect(err.providerName).toBe("YahooFinance");
    expect(err.cause).toBeInstanceOf(Error);
  });

  it("MarketDataUnavailableError funciona sin cause", () => {
    const err = new MarketDataUnavailableError("Yahoo");
    expect(err.code).toBe("MARKET_DATA_UNAVAILABLE");
    expect(err.cause).toBeUndefined();
  });

  it("UnauthorizedError tiene code correcto con mensaje default", () => {
    const err = new UnauthorizedError();
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("unauthorized");
  });

  it("UnauthorizedError acepta mensaje personalizado", () => {
    const err = new UnauthorizedError("sesión expirada");
    expect(err.message).toBe("sesión expirada");
  });
});
