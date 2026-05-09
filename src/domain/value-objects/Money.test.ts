import { describe, expect, it } from "vitest";

import { Money } from "./Money";

describe("Money", () => {
  describe("constructor", () => {
    it("crea instancia con amount y currency", () => {
      const m = Money.of(100, "MXN");
      expect(m.amount).toBe(100);
      expect(m.currency).toBe("MXN");
    });

    it("acepta amounts negativos (representan deudas o pérdidas)", () => {
      const m = Money.of(-50, "USD");
      expect(m.amount).toBe(-50);
    });

    it("acepta amounts decimales", () => {
      const m = Money.of(123.45, "MXN");
      expect(m.amount).toBe(123.45);
    });
  });

  describe("add", () => {
    it("suma cantidades de la misma moneda", () => {
      const a = Money.of(100, "MXN");
      const b = Money.of(50, "MXN");
      expect(a.add(b).amount).toBe(150);
      expect(a.add(b).currency).toBe("MXN");
    });

    it("lanza si las monedas difieren", () => {
      const a = Money.of(100, "MXN");
      const b = Money.of(50, "USD");
      expect(() => a.add(b)).toThrow(/currency mismatch/i);
    });

    it("es inmutable (no muta los operandos)", () => {
      const a = Money.of(100, "MXN");
      const b = Money.of(50, "MXN");
      a.add(b);
      expect(a.amount).toBe(100);
      expect(b.amount).toBe(50);
    });
  });

  describe("subtract", () => {
    it("resta cantidades de la misma moneda", () => {
      const a = Money.of(100, "MXN");
      const b = Money.of(30, "MXN");
      expect(a.subtract(b).amount).toBe(70);
    });

    it("lanza si las monedas difieren", () => {
      const a = Money.of(100, "MXN");
      const b = Money.of(50, "USD");
      expect(() => a.subtract(b)).toThrow(/currency mismatch/i);
    });
  });

  describe("multiply", () => {
    it("multiplica por un escalar", () => {
      const m = Money.of(50, "MXN");
      expect(m.multiply(3).amount).toBe(150);
      expect(m.multiply(3).currency).toBe("MXN");
    });

    it("acepta escalar fraccionario", () => {
      const m = Money.of(100, "MXN");
      expect(m.multiply(0.5).amount).toBe(50);
    });
  });

  describe("convert", () => {
    it("convierte de USD a MXN multiplicando por la tasa", () => {
      const usd = Money.of(100, "USD");
      const mxn = usd.convert(17.5, "MXN");
      expect(mxn.amount).toBeCloseTo(1750, 5);
      expect(mxn.currency).toBe("MXN");
    });

    it("lanza si la tasa es <= 0", () => {
      const usd = Money.of(100, "USD");
      expect(() => usd.convert(0, "MXN")).toThrow(/rate must be positive/i);
      expect(() => usd.convert(-1, "MXN")).toThrow(/rate must be positive/i);
    });

    it("permite convertir a la misma moneda con rate 1 (no-op)", () => {
      const m = Money.of(100, "MXN");
      const same = m.convert(1, "MXN");
      expect(same.amount).toBe(100);
      expect(same.currency).toBe("MXN");
    });
  });

  describe("equals", () => {
    it("regresa true si amount y currency coinciden", () => {
      expect(Money.of(100, "MXN").equals(Money.of(100, "MXN"))).toBe(true);
    });

    it("regresa false si amount difiere", () => {
      expect(Money.of(100, "MXN").equals(Money.of(101, "MXN"))).toBe(false);
    });

    it("regresa false si currency difiere", () => {
      expect(Money.of(100, "MXN").equals(Money.of(100, "USD"))).toBe(false);
    });
  });
});
