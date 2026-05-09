import { describe, expect, it } from "vitest";

import { applyPaperBuy, applyPaperSell, type PaperPortfolio } from "./PaperPortfolio";
import type { PaperPosition } from "./PaperPosition";
import type { PaperTrade } from "./PaperTrade";

const portfolio: PaperPortfolio = {
  id: "pp1",
  userId: "u1",
  name: "Práctica",
  cashBalanceMxn: 100_000,
  initialBalanceMxn: 100_000,
  createdAt: new Date("2026-01-01"),
  resetAt: null,
};

const baseTrade: PaperTrade = {
  id: "pt1",
  paperPortfolioId: "pp1",
  ticker: "WALMEX",
  exchange: "BMV",
  action: "BUY",
  quantity: 0,
  priceMxn: 0,
  executedAt: new Date("2026-01-15"),
  notes: null,
  createdAt: new Date("2026-01-15"),
};

describe("applyPaperBuy", () => {
  it("crea nueva posición si no existe previa", () => {
    const trade: PaperTrade = { ...baseTrade, quantity: 100, priceMxn: 70 };
    const out = applyPaperBuy(portfolio, trade, null);
    expect(out.portfolio.cashBalanceMxn).toBe(93_000);
    expect(out.position.quantity).toBe(100);
    expect(out.position.avgCostMxn).toBe(70);
  });

  it("recalcula avgCost al hacer BUY sobre posición existente", () => {
    const existing: PaperPosition = {
      id: "pos1",
      paperPortfolioId: "pp1",
      ticker: "WALMEX",
      exchange: "BMV",
      quantity: 100,
      avgCostMxn: 70,
      openedAt: new Date("2026-01-01"),
      closedAt: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };
    const trade: PaperTrade = { ...baseTrade, quantity: 50, priceMxn: 80 };
    const out = applyPaperBuy(portfolio, trade, existing);
    // (100*70 + 50*80) / 150 = 11000/150 = 73.3333
    expect(out.position.quantity).toBe(150);
    expect(out.position.avgCostMxn).toBeCloseTo(73.3333, 3);
    expect(out.portfolio.cashBalanceMxn).toBe(96_000);
  });

  it("lanza InsufficientFundsError si no alcanza cash", () => {
    const trade: PaperTrade = { ...baseTrade, quantity: 10_000, priceMxn: 70 };
    expect(() => applyPaperBuy(portfolio, trade, null)).toThrow(/insufficient funds/i);
  });

  it("lanza Error si action no es BUY", () => {
    const trade: PaperTrade = { ...baseTrade, action: "SELL", quantity: 100, priceMxn: 70 };
    expect(() => applyPaperBuy(portfolio, trade, null)).toThrow(/BUY/);
  });
});

describe("applyPaperSell", () => {
  const existing: PaperPosition = {
    id: "pos1",
    paperPortfolioId: "pp1",
    ticker: "WALMEX",
    exchange: "BMV",
    quantity: 100,
    avgCostMxn: 70,
    openedAt: new Date("2026-01-01"),
    closedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  it("disminuye cantidad y aumenta cash", () => {
    const trade: PaperTrade = { ...baseTrade, action: "SELL", quantity: 30, priceMxn: 75 };
    const out = applyPaperSell(portfolio, trade, existing);
    expect(out.position.quantity).toBe(70);
    expect(out.portfolio.cashBalanceMxn).toBe(102_250);
    expect(out.position.closedAt).toBeNull();
  });

  it("marca closedAt cuando cantidad llega a 0", () => {
    const trade: PaperTrade = {
      ...baseTrade,
      action: "SELL",
      quantity: 100,
      priceMxn: 75,
      executedAt: new Date("2026-02-01"),
    };
    const out = applyPaperSell(portfolio, trade, existing);
    expect(out.position.quantity).toBe(0);
    expect(out.position.closedAt).toEqual(new Date("2026-02-01"));
  });

  it("lanza InsufficientQuantityError si SELL excede cantidad", () => {
    const trade: PaperTrade = { ...baseTrade, action: "SELL", quantity: 200, priceMxn: 75 };
    expect(() => applyPaperSell(portfolio, trade, existing)).toThrow(/insufficient quantity/i);
  });

  it("lanza Error si action no es SELL", () => {
    const trade: PaperTrade = { ...baseTrade, action: "BUY", quantity: 30, priceMxn: 75 };
    expect(() => applyPaperSell(portfolio, trade, existing)).toThrow(/SELL/);
  });
});
