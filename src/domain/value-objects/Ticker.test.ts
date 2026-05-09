import { describe, expect, it } from "vitest";

import { Ticker } from "./Ticker";

describe("Ticker", () => {
  describe("parse - BMV", () => {
    it("acepta tickers con sufijo .MX como BMV", () => {
      const t = Ticker.parse("WALMEX.MX");
      expect(t.symbol).toBe("WALMEX");
      expect(t.exchange).toBe("BMV");
      expect(t.yahooSymbol).toBe("WALMEX.MX");
    });

    it("normaliza a mayúsculas", () => {
      const t = Ticker.parse("walmex.mx");
      expect(t.symbol).toBe("WALMEX");
      expect(t.yahooSymbol).toBe("WALMEX.MX");
    });

    it("acepta tickers BMV con números", () => {
      const t = Ticker.parse("AMXB.MX");
      expect(t.symbol).toBe("AMXB");
      expect(t.exchange).toBe("BMV");
    });
  });

  describe("parse - SIC", () => {
    it("trata tickers sin sufijo como SIC (US listings)", () => {
      const t = Ticker.parse("AAPL");
      expect(t.symbol).toBe("AAPL");
      expect(t.exchange).toBe("SIC");
      expect(t.yahooSymbol).toBe("AAPL");
    });

    it("normaliza a mayúsculas", () => {
      const t = Ticker.parse("aapl");
      expect(t.symbol).toBe("AAPL");
    });

    it("acepta ETFs como SPY, VOO, QQQ", () => {
      expect(Ticker.parse("SPY").exchange).toBe("SIC");
      expect(Ticker.parse("VOO").exchange).toBe("SIC");
    });
  });

  describe("parse - validación", () => {
    it("lanza si el ticker está vacío", () => {
      expect(() => Ticker.parse("")).toThrow(/empty/i);
      expect(() => Ticker.parse("   ")).toThrow(/empty/i);
    });

    it("lanza si contiene caracteres inválidos", () => {
      expect(() => Ticker.parse("WAL!MEX")).toThrow(/invalid/i);
      expect(() => Ticker.parse("WAL MEX")).toThrow(/invalid/i);
    });

    it("lanza si tiene más de un punto", () => {
      expect(() => Ticker.parse("WAL.MEX.MX")).toThrow(/invalid/i);
    });

    it("lanza si el sufijo no es .MX", () => {
      expect(() => Ticker.parse("WALMEX.US")).toThrow(/invalid/i);
    });
  });

  describe("equals", () => {
    it("regresa true si symbol y exchange coinciden", () => {
      expect(Ticker.parse("WALMEX.MX").equals(Ticker.parse("WALMEX.MX"))).toBe(true);
      expect(Ticker.parse("AAPL").equals(Ticker.parse("aapl"))).toBe(true);
    });

    it("regresa false si difieren", () => {
      expect(Ticker.parse("WALMEX.MX").equals(Ticker.parse("AMXB.MX"))).toBe(false);
      expect(Ticker.parse("AAPL").equals(Ticker.parse("MSFT"))).toBe(false);
    });
  });

  describe("toString", () => {
    it("regresa el yahooSymbol para BMV", () => {
      expect(Ticker.parse("WALMEX.MX").toString()).toBe("WALMEX.MX");
    });

    it("regresa el symbol para SIC", () => {
      expect(Ticker.parse("AAPL").toString()).toBe("AAPL");
    });
  });
});
