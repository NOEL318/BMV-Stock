import { describe, expect, it, vi } from "vitest";

import type { Holding } from "@/domain/entities/Holding";
import type { Trade } from "@/domain/entities/Trade";
import { InsufficientQuantityError } from "@/domain/errors/DomainError";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";
import type { TradeRepository } from "@/domain/ports/TradeRepository";

import { recordRealTrade } from "./recordRealTrade";

function makeHoldingRepo(overrides: Partial<HoldingRepository> = {}): HoldingRepository {
  return {
    listByUser: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByTickerAndExchange: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    ...overrides,
  };
}

function makeTradeRepo(overrides: Partial<TradeRepository> = {}): TradeRepository {
  return {
    listByUser: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    ...overrides,
  };
}

const baseInput = {
  userId: "u1",
  ticker: "WALMEX",
  exchange: "BMV" as const,
  quantity: 100,
  priceMxn: 70,
  commissionMxn: 5,
  executedAt: new Date("2026-01-15"),
  notes: null,
};

describe("recordRealTrade", () => {
  it("crea trade y holding nuevo si no existe posición previa (BUY)", async () => {
    const createdTrade: Trade = {
      ...baseInput,
      id: "t1",
      action: "BUY",
      createdAt: new Date(),
    };
    const createdHolding: Holding = {
      id: "h1",
      userId: "u1",
      ticker: "WALMEX",
      exchange: "BMV",
      quantity: 100,
      avgCostMxn: 70.05,
      openedAt: baseInput.executedAt,
      closedAt: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const tradeRepo = makeTradeRepo({ create: vi.fn().mockResolvedValue(createdTrade) });
    const holdingRepo = makeHoldingRepo({
      findByTickerAndExchange: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(createdHolding),
    });
    const result = await recordRealTrade({
      input: { ...baseInput, action: "BUY" },
      tradeRepo,
      holdingRepo,
    });
    expect(tradeRepo.create).toHaveBeenCalledTimes(1);
    expect(holdingRepo.create).toHaveBeenCalledTimes(1);
    expect(holdingRepo.update).not.toHaveBeenCalled();
    expect(result.trade).toEqual(createdTrade);
    expect(result.holding).toEqual(createdHolding);
  });

  it("aplica BUY adicional sobre holding existente (recalcula avgCost)", async () => {
    const existing: Holding = {
      id: "h1",
      userId: "u1",
      ticker: "WALMEX",
      exchange: "BMV",
      quantity: 100,
      avgCostMxn: 70,
      openedAt: new Date("2026-01-01"),
      closedAt: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const tradeRepo = makeTradeRepo({
      // La comisión es 0 en esta operación; el mock refleja el valor real del input.
      create: vi.fn().mockResolvedValue({
        ...baseInput,
        id: "t2",
        action: "BUY",
        quantity: 50,
        priceMxn: 80,
        commissionMxn: 0,
        createdAt: new Date(),
      }),
    });
    const holdingRepo = makeHoldingRepo({
      findByTickerAndExchange: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockImplementation(async (h) => h),
    });
    const result = await recordRealTrade({
      input: { ...baseInput, action: "BUY", quantity: 50, priceMxn: 80, commissionMxn: 0 },
      tradeRepo,
      holdingRepo,
    });
    expect(holdingRepo.create).not.toHaveBeenCalled();
    expect(holdingRepo.update).toHaveBeenCalledTimes(1);
    // avgCost = (100*70 + 50*80) / 150 = 11000/150
    expect(result.holding.avgCostMxn).toBeCloseTo(73.3333, 3);
    expect(result.holding.quantity).toBe(150);
  });

  it("SELL exige holding existente; lanza si no hay", async () => {
    const tradeRepo = makeTradeRepo();
    const holdingRepo = makeHoldingRepo({
      findByTickerAndExchange: vi.fn().mockResolvedValue(null),
    });
    await expect(
      recordRealTrade({
        input: { ...baseInput, action: "SELL", quantity: 10 },
        tradeRepo,
        holdingRepo,
      }),
    ).rejects.toThrow(/no existing holding/i);
  });

  it("SELL excedente lanza InsufficientQuantityError", async () => {
    const existing: Holding = {
      id: "h1",
      userId: "u1",
      ticker: "WALMEX",
      exchange: "BMV",
      quantity: 50,
      avgCostMxn: 70,
      openedAt: new Date("2026-01-01"),
      closedAt: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // El mock de create devuelve un trade que excede la cantidad disponible (50).
    const tradeRepo = makeTradeRepo({
      create: vi.fn().mockResolvedValue({
        ...baseInput,
        id: "t4",
        action: "SELL",
        quantity: 100,
        createdAt: new Date(),
      }),
    });
    const holdingRepo = makeHoldingRepo({
      findByTickerAndExchange: vi.fn().mockResolvedValue(existing),
    });
    await expect(
      recordRealTrade({
        input: { ...baseInput, action: "SELL", quantity: 100 },
        tradeRepo,
        holdingRepo,
      }),
    ).rejects.toThrow(InsufficientQuantityError);
  });

  it("DIVIDEND no muta el holding pero registra el trade", async () => {
    const existing: Holding = {
      id: "h1",
      userId: "u1",
      ticker: "WALMEX",
      exchange: "BMV",
      quantity: 100,
      avgCostMxn: 70,
      openedAt: new Date("2026-01-01"),
      closedAt: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const tradeRepo = makeTradeRepo({
      create: vi.fn().mockResolvedValue({
        ...baseInput,
        id: "t3",
        action: "DIVIDEND",
        quantity: 1,
        priceMxn: 250,
        createdAt: new Date(),
      }),
    });
    const holdingRepo = makeHoldingRepo({
      findByTickerAndExchange: vi.fn().mockResolvedValue(existing),
    });
    const result = await recordRealTrade({
      input: { ...baseInput, action: "DIVIDEND", quantity: 1, priceMxn: 250 },
      tradeRepo,
      holdingRepo,
    });
    expect(holdingRepo.create).not.toHaveBeenCalled();
    expect(holdingRepo.update).not.toHaveBeenCalled();
    expect(result.holding).toEqual(existing);
  });
});
