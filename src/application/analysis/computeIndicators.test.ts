import { describe, expect, it } from "vitest";

import { computeEMA, computeMACD, computeRSI, computeSMA } from "./computeIndicators";

describe("computeSMA", () => {
  it("calcula SMA de período 3 sobre serie de 5 puntos", () => {
    const prices = [10, 12, 14, 13, 15];
    const sma = computeSMA(prices, 3);
    // Primeros 2 son null (no hay suficientes datos)
    expect(sma).toEqual([null, null, 12, 13, 14]);
  });

  it("regresa array de nulls si período mayor a la longitud", () => {
    expect(computeSMA([1, 2, 3], 5)).toEqual([null, null, null]);
  });

  it("array vacío regresa array vacío", () => {
    expect(computeSMA([], 5)).toEqual([]);
  });
});

describe("computeEMA", () => {
  it("primer valor del EMA es el SMA del período inicial", () => {
    const prices = [10, 12, 14, 13, 15];
    const ema = computeEMA(prices, 3);
    expect(ema[0]).toBeNull();
    expect(ema[1]).toBeNull();
    expect(ema[2]).toBeCloseTo(12, 3);
  });

  it("EMA con período 1 regresa los precios mismos", () => {
    const prices = [10, 20, 30];
    const ema = computeEMA(prices, 1);
    expect(ema).toEqual([10, 20, 30]);
  });
});

describe("computeRSI", () => {
  it("calcula RSI de período 14 sobre una serie monotónica creciente (RSI = 100)", () => {
    const prices = Array.from({ length: 20 }, (_, i) => i + 1);
    const rsi = computeRSI(prices, 14);
    expect(rsi[14]).toBeCloseTo(100, 1);
  });

  it("calcula RSI sobre una serie monotónica decreciente (RSI = 0)", () => {
    const prices = Array.from({ length: 20 }, (_, i) => 20 - i);
    const rsi = computeRSI(prices, 14);
    expect(rsi[14]).toBeCloseTo(0, 1);
  });

  it("regresa nulls hasta tener suficientes datos", () => {
    const prices = [10, 11, 12];
    const rsi = computeRSI(prices, 14);
    expect(rsi.every((v) => v === null)).toBe(true);
  });
});

describe("computeMACD", () => {
  it("regresa { macd, signal, histogram } con misma longitud que precios", () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 5) * 10);
    const result = computeMACD(prices);
    expect(result.macd).toHaveLength(50);
    expect(result.signal).toHaveLength(50);
    expect(result.histogram).toHaveLength(50);
  });

  it("histogram = macd - signal (donde ambos no son null)", () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
    const { macd, signal, histogram } = computeMACD(prices);
    for (let i = 0; i < prices.length; i++) {
      if (macd[i] !== null && signal[i] !== null) {
        expect(histogram[i]).toBeCloseTo((macd[i] as number) - (signal[i] as number), 5);
      }
    }
  });
});
