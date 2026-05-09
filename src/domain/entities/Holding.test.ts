import { describe, expect, it } from "vitest";

import { applyTradeToHolding, createHoldingFromBuy, type Holding } from "./Holding";
import type { Trade } from "./Trade";

const baseTrade: Trade = {
  id: "t1",
  userId: "u1",
  ticker: "WALMEX",
  exchange: "BMV",
  action: "BUY",
  quantity: 0,
  priceMxn: 0,
  commissionMxn: 0,
  executedAt: new Date("2026-01-15"),
  notes: null,
  createdAt: new Date("2026-01-15"),
};

describe("createHoldingFromBuy", () => {
  it("crea holding inicial con avgCost = (price + commission/qty)", () => {
    const trade: Trade = { ...baseTrade, quantity: 100, priceMxn: 70, commissionMxn: 10 };
    const h = createHoldingFromBuy(trade);
    expect(h.ticker).toBe("WALMEX");
    expect(h.exchange).toBe("BMV");
    expect(h.quantity).toBe(100);
    // avgCost = (100*70 + 10) / 100 = 70.10
    expect(h.avgCostMxn).toBeCloseTo(70.1, 5);
    expect(h.openedAt).toEqual(trade.executedAt);
    expect(h.closedAt).toBeNull();
  });

  it("lanza si la action no es BUY", () => {
    const trade: Trade = { ...baseTrade, action: "SELL", quantity: 100, priceMxn: 70 };
    expect(() => createHoldingFromBuy(trade)).toThrow(/BUY/i);
  });
});

describe("applyTradeToHolding - BUY", () => {
  it("recalcula avgCost como promedio ponderado al hacer BUY adicional", () => {
    const initial: Holding = {
      id: "h1",
      userId: "u1",
      ticker: "WALMEX",
      exchange: "BMV",
      quantity: 100,
      avgCostMxn: 70,
      openedAt: new Date("2026-01-01"),
      closedAt: null,
      notes: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };
    const trade: Trade = {
      ...baseTrade,
      action: "BUY",
      quantity: 50,
      priceMxn: 80,
      commissionMxn: 5,
    };
    const updated = applyTradeToHolding(initial, trade);
    // (100*70 + 50*80 + 5) / 150 = (7000 + 4000 + 5) / 150 = 73.3666...
    expect(updated.quantity).toBe(150);
    expect(updated.avgCostMxn).toBeCloseTo(73.3667, 4);
  });
});

describe("applyTradeToHolding - SELL", () => {
  it("disminuye cantidad sin tocar avgCost", () => {
    const initial: Holding = {
      id: "h1",
      userId: "u1",
      ticker: "WALMEX",
      exchange: "BMV",
      quantity: 100,
      avgCostMxn: 70,
      openedAt: new Date("2026-01-01"),
      closedAt: null,
      notes: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };
    const trade: Trade = { ...baseTrade, action: "SELL", quantity: 30, priceMxn: 75 };
    const updated = applyTradeToHolding(initial, trade);
    expect(updated.quantity).toBe(70);
    expect(updated.avgCostMxn).toBe(70);
    expect(updated.closedAt).toBeNull();
  });

  it("marca closedAt cuando la cantidad llega a 0", () => {
    const initial: Holding = {
      id: "h1",
      userId: "u1",
      ticker: "WALMEX",
      exchange: "BMV",
      quantity: 100,
      avgCostMxn: 70,
      openedAt: new Date("2026-01-01"),
      closedAt: null,
      notes: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };
    const trade: Trade = {
      ...baseTrade,
      action: "SELL",
      quantity: 100,
      priceMxn: 75,
      executedAt: new Date("2026-02-01"),
    };
    const updated = applyTradeToHolding(initial, trade);
    expect(updated.quantity).toBe(0);
    expect(updated.closedAt).toEqual(new Date("2026-02-01"));
  });

  it("lanza InsufficientQuantityError si SELL excede cantidad disponible", () => {
    const initial: Holding = {
      id: "h1",
      userId: "u1",
      ticker: "WALMEX",
      exchange: "BMV",
      quantity: 50,
      avgCostMxn: 70,
      openedAt: new Date("2026-01-01"),
      closedAt: null,
      notes: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };
    const trade: Trade = { ...baseTrade, action: "SELL", quantity: 100, priceMxn: 75 };
    expect(() => applyTradeToHolding(initial, trade)).toThrow(/insufficient quantity/i);
  });
});

describe("applyTradeToHolding - DIVIDEND", () => {
  it("no afecta cantidad ni avgCost", () => {
    const initial: Holding = {
      id: "h1",
      userId: "u1",
      ticker: "WALMEX",
      exchange: "BMV",
      quantity: 100,
      avgCostMxn: 70,
      openedAt: new Date("2026-01-01"),
      closedAt: null,
      notes: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };
    const trade: Trade = { ...baseTrade, action: "DIVIDEND", quantity: 1, priceMxn: 250 };
    const updated = applyTradeToHolding(initial, trade);
    expect(updated.quantity).toBe(100);
    expect(updated.avgCostMxn).toBe(70);
  });
});
