# BMV Stock · Plan 3 · Portafolio Real + Paper Trading

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development o superpowers:executing-plans. Steps con checkbox (`- [ ]`).

> **Preferencias del usuario:** Sin `git commit` automático. Sin emojis. TSDoc en cada export. Comentarios en español con acentos. Identificadores en inglés. Strict TS.

> **Pre-condición:** Plan 1 + Plan 2 ejecutados. Dominio + Yahoo + endpoint `/api/quotes` operativos. Hay 71 tests passing y cobertura >=90% en domain/application.

**Goal:** Construir las páginas y use cases para que el usuario pueda registrar trades reales (después de ejecutarlos en GBM+) y simular trades en su portafolio paper. Incluye toda la cadena: use cases con TDD → API routes → hooks de TanStack Query → componentes financieros → páginas con formularios.

**Architecture:** Mismo patrón clean architecture. Cada use case es función pura que recibe sus dependencias (repos + provider) por argumento. API routes thin que llaman a `getDeps()`. Componentes financieros reusables con CVA variants. Forms con `react-hook-form` + `zodResolver`.

**Tech Stack:** Mismos del Plan 1 y 2. Se agregan `react-hook-form` y `@hookform/resolvers` (Zod adapter).

**Spec referencia:** `docs/superpowers/specs/2026-05-06-bmv-stock-design.md` (sección 7 entidades, sección 8 flujos críticos, sección 9 componentes).

---

## File structure que se creará

```
src/
├── application/
│   ├── portfolio/
│   │   ├── recordRealTrade.ts (+ .test.ts)
│   │   ├── getHoldings.ts (+ .test.ts)
│   │   ├── computePortfolioMetrics.ts (+ .test.ts)
│   │   └── getSectorAllocation.ts (+ .test.ts)
│   └── paper-trading/
│       ├── executePaperTrade.ts (+ .test.ts)
│       ├── getPaperPortfolio.ts (+ .test.ts)
│       └── resetPaperPortfolio.ts (+ .test.ts)
├── lib/schemas/
│   ├── trade.ts                                    ← Zod schemas para forms
│   └── paperTrade.ts
├── components/
│   ├── finance/
│   │   ├── MoneyDisplay/{MoneyDisplay,.types,.styles,.test}.tsx
│   │   ├── TickerBadge/...
│   │   ├── ExchangeBadge/...
│   │   ├── PnLBadge/...
│   │   └── MetricCard/...
│   ├── tables/
│   │   ├── DataTable/{DataTable,.types,.styles}.tsx     ← genérico
│   │   ├── PortfolioTable/...                            ← container
│   │   └── PortfolioTableView/...                        ← presentational
│   └── forms/
│       ├── TradeForm/...                                  ← BUY/SELL/DIVIDEND
│       └── PaperTradeForm/...
├── hooks/
│   ├── usePortfolio.ts
│   ├── usePaperPortfolio.ts
│   └── usePaperTrades.ts
└── app/
    ├── api/
    │   ├── portfolio/
    │   │   ├── route.ts                                   ← GET holdings + metrics
    │   │   └── trades/route.ts                            ← POST trade real
    │   └── paper-trading/
    │       ├── route.ts                                   ← GET portfolio + positions
    │       ├── trades/route.ts                            ← POST/GET paper trades
    │       └── reset/route.ts                             ← POST reset
    └── (app)/
        ├── portfolio/
        │   ├── page.tsx                                   ← reemplaza placeholder
        │   └── trade/page.tsx                             ← form
        └── paper-trading/
            ├── page.tsx                                   ← reemplaza placeholder
            ├── trade/page.tsx                             ← form
            └── history/page.tsx                           ← lista de trades
```

---

## Task 1: Schemas Zod compartidos

**Goal:** Definir schemas Zod que validan body de POST de trades. Se reusan en frontend (form validation con `zodResolver`) y backend (API routes).

**Files:**

- Create: `src/lib/schemas/trade.ts`, `src/lib/schemas/paperTrade.ts`

- [ ] **Step 1.1: Schema de trade real**

`src/lib/schemas/trade.ts`:

```ts
import { z } from "zod";

/**
 * Schema del body para POST /api/portfolio/trades.
 * Reusable en el frontend para validación del form.
 */
export const recordTradeSchema = z.object({
  ticker: z.string().min(1).max(20),
  exchange: z.enum(["BMV", "SIC"]),
  action: z.enum(["BUY", "SELL", "DIVIDEND"]),
  quantity: z.number().positive(),
  priceMxn: z.number().positive(),
  commissionMxn: z.number().min(0).default(0),
  executedAt: z.coerce.date(),
  notes: z.string().max(500).nullable().default(null),
});

export type RecordTradeInput = z.infer<typeof recordTradeSchema>;
```

- [ ] **Step 1.2: Schema de paper trade**

`src/lib/schemas/paperTrade.ts`:

```ts
import { z } from "zod";

/**
 * Schema del body para POST /api/paper-trading/trades.
 */
export const executePaperTradeSchema = z.object({
  ticker: z.string().min(1).max(20),
  exchange: z.enum(["BMV", "SIC"]),
  action: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive(),
  /** Si null, el server usa el último precio del cache de cotizaciones. */
  priceMxn: z.number().positive().nullable().default(null),
  notes: z.string().max(500).nullable().default(null),
});

export type ExecutePaperTradeInput = z.infer<typeof executePaperTradeSchema>;
```

**Checkpoint Task 1.**

---

## Task 2: Use case `recordRealTrade` (TDD)

**Goal:** Registrar un trade real, actualizar el holding correspondiente, todo en una transacción lógica.

**Files:**

- Create: `src/application/portfolio/recordRealTrade.ts` + `.test.ts`

- [ ] **Step 2.1: Test fallido**

`src/application/portfolio/recordRealTrade.test.ts`:

```ts
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
      create: vi
        .fn()
        .mockResolvedValue({ ...baseInput, id: "t2", action: "BUY", createdAt: new Date() }),
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
    const tradeRepo = makeTradeRepo();
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
```

- [ ] **Step 2.2: Implementar**

`src/application/portfolio/recordRealTrade.ts`:

```ts
import { applyTradeToHolding, createHoldingFromBuy, type Holding } from "@/domain/entities/Holding";
import type { Trade, TradeAction } from "@/domain/entities/Trade";
import type { Exchange } from "@/domain/value-objects/Ticker";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";
import type { TradeRepository } from "@/domain/ports/TradeRepository";

/**
 * Input para registrar un trade real.
 * Es el body validado del endpoint POST /api/portfolio/trades.
 */
export interface RecordRealTradeInput {
  userId: string;
  ticker: string;
  exchange: Exchange;
  action: TradeAction;
  quantity: number;
  priceMxn: number;
  commissionMxn: number;
  executedAt: Date;
  notes: string | null;
}

/**
 * Argumentos del use case.
 */
export interface RecordRealTradeArgs {
  input: RecordRealTradeInput;
  tradeRepo: TradeRepository;
  holdingRepo: HoldingRepository;
}

/**
 * Resultado: el trade insertado y el holding resultante.
 */
export interface RecordRealTradeResult {
  trade: Trade;
  holding: Holding;
}

/**
 * Registra un trade real ejecutado por el usuario en GBM+ y actualiza el
 * holding correspondiente.
 *
 * Reglas:
 * - BUY sin holding previo: crea holding nuevo con `createHoldingFromBuy`.
 * - BUY sobre holding existente: aplica `applyTradeToHolding`, recalcula avgCost.
 * - SELL: requiere holding existente; lanza error si no hay. Lanza
 *   `InsufficientQuantityError` si la cantidad excede.
 * - DIVIDEND: registra el trade pero no muta el holding.
 *
 * @throws Error si SELL sin holding previo
 * @throws InsufficientQuantityError si SELL excede la cantidad disponible
 */
export async function recordRealTrade({
  input,
  tradeRepo,
  holdingRepo,
}: RecordRealTradeArgs): Promise<RecordRealTradeResult> {
  // Insertar el trade primero — es la fuente de verdad.
  const trade = await tradeRepo.create(input);
  const existing = await holdingRepo.findByTickerAndExchange(
    input.userId,
    input.ticker,
    input.exchange,
  );
  let holding: Holding;
  if (input.action === "BUY" && !existing) {
    const created = await holdingRepo.create(createHoldingFromBuy(trade));
    holding = created;
  } else if (input.action === "BUY" && existing) {
    holding = await holdingRepo.update(applyTradeToHolding(existing, trade));
  } else if (input.action === "SELL") {
    if (!existing) {
      throw new Error(`no existing holding to sell ${input.ticker} (${input.exchange})`);
    }
    holding = await holdingRepo.update(applyTradeToHolding(existing, trade));
  } else {
    // DIVIDEND
    if (!existing) {
      // Permitido sin holding (dividendo de posición ya cerrada). En ese caso
      // simplemente registramos el trade sin afectar holdings.
      holding = {
        id: "",
        userId: input.userId,
        ticker: input.ticker,
        exchange: input.exchange,
        quantity: 0,
        avgCostMxn: 0,
        openedAt: input.executedAt,
        closedAt: input.executedAt,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      holding = existing;
    }
  }
  return { trade, holding };
}
```

- [ ] **Step 2.3: Test pasa**

```bash
pnpm test src/application/portfolio/recordRealTrade
```

Expected: 5 tests passing.

**Checkpoint Task 2.**

---

## Task 3: Use case `getHoldings` + `computePortfolioMetrics` (TDD)

**Goal:** Listar holdings activos con cotizaciones actuales y P&L por posición. `computePortfolioMetrics` calcula totales agregados (valor de mercado, costo total, P&L total, P&L %).

**Files:**

- Create: `src/application/portfolio/getHoldings.ts` + `.test.ts`
- Create: `src/application/portfolio/computePortfolioMetrics.ts` + `.test.ts`

- [ ] **Step 3.1: Implementar `getHoldings`**

`src/application/portfolio/getHoldings.ts`:

```ts
import type { Holding } from "@/domain/entities/Holding";
import type { Quote } from "@/domain/entities/Quote";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import { Ticker } from "@/domain/value-objects/Ticker";

/**
 * Holding enriquecido con su cotización actual y P&L sin realizar.
 */
export interface HoldingWithQuote {
  holding: Holding;
  quote: Quote | null;
  /** Valor de mercado en MXN (quantity * priceMxn). null si no hay quote. */
  marketValueMxn: number | null;
  /** Costo total invertido (quantity * avgCostMxn). */
  costBasisMxn: number;
  /** P&L sin realizar en MXN. null si no hay quote. */
  unrealizedPnLMxn: number | null;
  /** P&L sin realizar en porcentaje (0..1). null si no hay quote. */
  unrealizedPnLPercent: number | null;
}

export interface GetHoldingsArgs {
  userId: string;
  holdingRepo: HoldingRepository;
  marketData: MarketDataProvider;
}

/**
 * Lista los holdings activos del usuario, cada uno con su cotización actual
 * y P&L calculado. Si una cotización falla (ticker no encontrado, mercado
 * caído), el holding se incluye con `quote: null` y P&L null — la UI debe
 * mostrar "sin datos" en lugar de fingir números.
 */
export async function getHoldings({
  userId,
  holdingRepo,
  marketData,
}: GetHoldingsArgs): Promise<HoldingWithQuote[]> {
  const holdings = await holdingRepo.listByUser(userId);
  return Promise.all(
    holdings.map(async (h) => {
      const ticker = new TickerLike(h.ticker, h.exchange).toTicker();
      let quote: Quote | null = null;
      try {
        quote = await marketData.getQuote(ticker);
      } catch {
        // Tolerar fallos individuales — un ticker caído no rompe toda la lista.
      }
      const costBasisMxn = h.quantity * h.avgCostMxn;
      const marketValueMxn = quote ? h.quantity * quote.priceMxn : null;
      const unrealizedPnLMxn = marketValueMxn !== null ? marketValueMxn - costBasisMxn : null;
      const unrealizedPnLPercent =
        unrealizedPnLMxn !== null && costBasisMxn > 0 ? unrealizedPnLMxn / costBasisMxn : null;
      return {
        holding: h,
        quote,
        marketValueMxn,
        costBasisMxn,
        unrealizedPnLMxn,
        unrealizedPnLPercent,
      };
    }),
  );
}

/**
 * Helper interno: construye un `Ticker` desde el par (symbol, exchange) que
 * vienen del holding (que no tiene un Ticker, solo strings).
 */
class TickerLike {
  constructor(
    private symbol: string,
    private exchange: "BMV" | "SIC",
  ) {}
  toTicker(): Ticker {
    return Ticker.parse(this.exchange === "BMV" ? `${this.symbol}.MX` : this.symbol);
  }
}
```

- [ ] **Step 3.2: Test de `getHoldings`**

`src/application/portfolio/getHoldings.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import type { Holding } from "@/domain/entities/Holding";
import type { Quote } from "@/domain/entities/Quote";
import { TickerNotFoundError } from "@/domain/errors/DomainError";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";

import { getHoldings } from "./getHoldings";

const holding1: Holding = {
  id: "h1",
  userId: "u1",
  ticker: "WALMEX",
  exchange: "BMV",
  quantity: 100,
  avgCostMxn: 70,
  openedAt: new Date(),
  closedAt: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const quote1: Quote = {
  ticker: "WALMEX",
  exchange: "BMV",
  priceMxn: 75,
  priceUsd: null,
  openMxn: 74,
  highMxn: 76,
  lowMxn: 73,
  volume: 1_000_000,
  asOf: new Date(),
};

describe("getHoldings", () => {
  it("regresa holdings enriquecidos con quote y P&L", async () => {
    const holdingRepo: HoldingRepository = {
      listByUser: vi.fn().mockResolvedValue([holding1]),
      findById: vi.fn(),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    const marketData: MarketDataProvider = {
      getQuote: vi.fn().mockResolvedValue(quote1),
      getHistorical: vi.fn(),
      getMarketSnapshot: vi.fn(),
    };
    const result = await getHoldings({ userId: "u1", holdingRepo, marketData });
    expect(result).toHaveLength(1);
    const r = result[0]!;
    expect(r.holding).toEqual(holding1);
    expect(r.quote).toEqual(quote1);
    expect(r.costBasisMxn).toBe(7000);
    expect(r.marketValueMxn).toBe(7500);
    expect(r.unrealizedPnLMxn).toBe(500);
    expect(r.unrealizedPnLPercent).toBeCloseTo(0.0714, 4);
  });

  it("tolera fallo de quote individual y regresa null", async () => {
    const holdingRepo: HoldingRepository = {
      listByUser: vi.fn().mockResolvedValue([holding1]),
      findById: vi.fn(),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    const marketData: MarketDataProvider = {
      getQuote: vi.fn().mockRejectedValue(new TickerNotFoundError("WALMEX")),
      getHistorical: vi.fn(),
      getMarketSnapshot: vi.fn(),
    };
    const result = await getHoldings({ userId: "u1", holdingRepo, marketData });
    expect(result[0]!.quote).toBeNull();
    expect(result[0]!.marketValueMxn).toBeNull();
    expect(result[0]!.unrealizedPnLMxn).toBeNull();
  });
});
```

- [ ] **Step 3.3: Implementar `computePortfolioMetrics`**

`src/application/portfolio/computePortfolioMetrics.ts`:

```ts
import type { HoldingWithQuote } from "./getHoldings";

/**
 * Métricas agregadas del portafolio entero.
 */
export interface PortfolioMetrics {
  totalCostBasisMxn: number;
  totalMarketValueMxn: number;
  totalUnrealizedPnLMxn: number;
  totalUnrealizedPnLPercent: number;
  /** Cantidad de holdings con quote disponible. */
  countWithQuote: number;
  /** Cantidad de holdings sin quote (no se incluyen en marketValue). */
  countMissingQuote: number;
}

/**
 * Suma los valores de mercado, cost basis y P&L de todos los holdings.
 * Holdings sin quote disponible no contribuyen al market value (se reflejan
 * en `countMissingQuote`).
 */
export function computePortfolioMetrics(holdings: HoldingWithQuote[]): PortfolioMetrics {
  let totalCost = 0;
  let totalMarket = 0;
  let countWithQuote = 0;
  let countMissingQuote = 0;
  for (const h of holdings) {
    totalCost += h.costBasisMxn;
    if (h.marketValueMxn !== null) {
      totalMarket += h.marketValueMxn;
      countWithQuote += 1;
    } else {
      countMissingQuote += 1;
    }
  }
  const totalPnL = totalMarket - totalCost;
  const totalPnLPercent = totalCost > 0 ? totalPnL / totalCost : 0;
  return {
    totalCostBasisMxn: totalCost,
    totalMarketValueMxn: totalMarket,
    totalUnrealizedPnLMxn: totalPnL,
    totalUnrealizedPnLPercent: totalPnLPercent,
    countWithQuote,
    countMissingQuote,
  };
}
```

- [ ] **Step 3.4: Test de `computePortfolioMetrics`**

`src/application/portfolio/computePortfolioMetrics.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { HoldingWithQuote } from "./getHoldings";
import { computePortfolioMetrics } from "./computePortfolioMetrics";

function holding(cost: number, market: number | null): HoldingWithQuote {
  return {
    holding: {} as never,
    quote: null,
    costBasisMxn: cost,
    marketValueMxn: market,
    unrealizedPnLMxn: market !== null ? market - cost : null,
    unrealizedPnLPercent: market !== null && cost > 0 ? (market - cost) / cost : null,
  };
}

describe("computePortfolioMetrics", () => {
  it("suma cost y market correctamente", () => {
    const m = computePortfolioMetrics([holding(1000, 1100), holding(500, 600)]);
    expect(m.totalCostBasisMxn).toBe(1500);
    expect(m.totalMarketValueMxn).toBe(1700);
    expect(m.totalUnrealizedPnLMxn).toBe(200);
    expect(m.totalUnrealizedPnLPercent).toBeCloseTo(0.1333, 4);
    expect(m.countWithQuote).toBe(2);
    expect(m.countMissingQuote).toBe(0);
  });

  it("cuenta holdings sin quote sin sumarlos a market", () => {
    const m = computePortfolioMetrics([holding(1000, 1100), holding(500, null)]);
    expect(m.totalCostBasisMxn).toBe(1500);
    expect(m.totalMarketValueMxn).toBe(1100);
    expect(m.countMissingQuote).toBe(1);
  });

  it("regresa pct=0 cuando cost basis es 0", () => {
    const m = computePortfolioMetrics([]);
    expect(m.totalUnrealizedPnLPercent).toBe(0);
  });
});
```

- [ ] **Step 3.5: Tests pasan**

```bash
pnpm test src/application/portfolio
```

**Checkpoint Task 3.**

---

## Task 4: Use cases de paper trading (TDD)

**Goal:** `executePaperTrade` (BUY/SELL con validación de fondos), `getPaperPortfolio` (lista positions con P&L), `resetPaperPortfolio` (reseteo a saldo inicial).

**Files:**

- Create: `src/application/paper-trading/executePaperTrade.ts` + `.test.ts`
- Create: `src/application/paper-trading/getPaperPortfolio.ts` + `.test.ts`
- Create: `src/application/paper-trading/resetPaperPortfolio.ts` + `.test.ts`

- [ ] **Step 4.1: Implementar `executePaperTrade`**

`src/application/paper-trading/executePaperTrade.ts`:

```ts
import {
  applyPaperBuy,
  applyPaperSell,
  type PaperPortfolio,
} from "@/domain/entities/PaperPortfolio";
import type { PaperPosition } from "@/domain/entities/PaperPosition";
import type { PaperTrade, PaperTradeAction } from "@/domain/entities/PaperTrade";
import type { Exchange } from "@/domain/value-objects/Ticker";
import { Ticker } from "@/domain/value-objects/Ticker";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";
import type { PaperPositionRepository } from "@/domain/ports/PaperPositionRepository";
import type { PaperTradeRepository } from "@/domain/ports/PaperTradeRepository";

export interface ExecutePaperTradeInput {
  userId: string;
  ticker: string;
  exchange: Exchange;
  action: PaperTradeAction;
  quantity: number;
  /** Si null, el use case usa el último precio del provider. */
  priceMxn: number | null;
  notes: string | null;
}

export interface ExecutePaperTradeArgs {
  input: ExecutePaperTradeInput;
  paperPortfolioRepo: PaperPortfolioRepository;
  paperPositionRepo: PaperPositionRepository;
  paperTradeRepo: PaperTradeRepository;
  marketData: MarketDataProvider;
}

export interface ExecutePaperTradeResult {
  trade: PaperTrade;
  position: PaperPosition;
  portfolio: PaperPortfolio;
}

/**
 * Ejecuta un paper trade: valida fondos/cantidad, persiste el trade,
 * actualiza/crea la posición y ajusta `cashBalanceMxn` del portfolio.
 *
 * Si el caller no provee `priceMxn`, se usa el último precio del provider
 * (que generalmente es el cache de quote_cache si está fresco).
 *
 * @throws Error si el usuario no tiene paper portfolio
 * @throws InsufficientFundsError si BUY excede `cashBalanceMxn`
 * @throws InsufficientQuantityError si SELL excede la posición
 */
export async function executePaperTrade({
  input,
  paperPortfolioRepo,
  paperPositionRepo,
  paperTradeRepo,
  marketData,
}: ExecutePaperTradeArgs): Promise<ExecutePaperTradeResult> {
  const portfolio = await paperPortfolioRepo.findByUser(input.userId);
  if (!portfolio) {
    throw new Error(`paper portfolio not found for user ${input.userId}`);
  }
  const ticker = Ticker.parse(input.exchange === "BMV" ? `${input.ticker}.MX` : input.ticker);
  const priceMxn = input.priceMxn ?? (await marketData.getQuote(ticker)).priceMxn;

  const existing = await paperPositionRepo.findByTickerAndExchange(
    portfolio.id,
    input.ticker,
    input.exchange,
  );

  // Construir el trade pendiente (todavía sin persistir).
  const pendingTrade: PaperTrade = {
    id: "",
    paperPortfolioId: portfolio.id,
    ticker: input.ticker,
    exchange: input.exchange,
    action: input.action,
    quantity: input.quantity,
    priceMxn,
    executedAt: new Date(),
    notes: input.notes,
    createdAt: new Date(),
  };

  // Aplicar la lógica de dominio para validar y calcular el outcome.
  const outcome =
    input.action === "BUY"
      ? applyPaperBuy(portfolio, pendingTrade, existing)
      : (() => {
          if (!existing) {
            throw new Error(`no existing paper position to sell ${input.ticker}`);
          }
          return applyPaperSell(portfolio, pendingTrade, existing);
        })();

  // Persistir: trade primero (inmutable), luego portfolio y position.
  const trade = await paperTradeRepo.create(pendingTrade);
  const updatedPortfolio = await paperPortfolioRepo.update(outcome.portfolio);
  const position =
    existing && existing.id !== ""
      ? await paperPositionRepo.update({ ...outcome.position, id: existing.id })
      : await paperPositionRepo.create(outcome.position);
  return { trade, portfolio: updatedPortfolio, position };
}
```

- [ ] **Step 4.2: Test de `executePaperTrade`**

Tests deben cubrir:

- BUY exitoso sin posición previa → crea position
- BUY exitoso con posición previa → update position con avgCost recalculado
- BUY sin fondos → InsufficientFundsError
- SELL parcial → cantidad disminuye, cash aumenta
- SELL total → position cerrada
- SELL excedente → InsufficientQuantityError
- Sin paper portfolio → Error
- priceMxn null → usa quote del provider

Crear `src/application/paper-trading/executePaperTrade.test.ts` con vi.fn() para todos los repos + provider. Usar fixtures de `PaperPortfolio` con cash 100000, etc. Mínimo 6 tests.

- [ ] **Step 4.3: Implementar `getPaperPortfolio`**

`src/application/paper-trading/getPaperPortfolio.ts`:

```ts
import type { PaperPortfolio } from "@/domain/entities/PaperPortfolio";
import type { PaperPosition } from "@/domain/entities/PaperPosition";
import type { Quote } from "@/domain/entities/Quote";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";
import type { PaperPositionRepository } from "@/domain/ports/PaperPositionRepository";
import { Ticker } from "@/domain/value-objects/Ticker";

export interface PaperPositionWithQuote {
  position: PaperPosition;
  quote: Quote | null;
  costBasisMxn: number;
  marketValueMxn: number | null;
  unrealizedPnLMxn: number | null;
  unrealizedPnLPercent: number | null;
}

export interface PaperPortfolioState {
  portfolio: PaperPortfolio;
  positions: PaperPositionWithQuote[];
  /** Suma de cash + market value de todas las posiciones con quote. */
  totalEquityMxn: number;
  /** Diferencia entre totalEquity actual y initialBalance. */
  totalReturnMxn: number;
  /** Retorno como porcentaje (0..1) sobre el initialBalance. */
  totalReturnPercent: number;
}

export interface GetPaperPortfolioArgs {
  userId: string;
  paperPortfolioRepo: PaperPortfolioRepository;
  paperPositionRepo: PaperPositionRepository;
  marketData: MarketDataProvider;
}

/**
 * Obtiene el estado completo del paper portfolio: portfolio + posiciones
 * con cotización + métricas agregadas (equity total, retorno).
 */
export async function getPaperPortfolio({
  userId,
  paperPortfolioRepo,
  paperPositionRepo,
  marketData,
}: GetPaperPortfolioArgs): Promise<PaperPortfolioState | null> {
  const portfolio = await paperPortfolioRepo.findByUser(userId);
  if (!portfolio) return null;
  const positions = await paperPositionRepo.listByPortfolio(portfolio.id);
  const enriched = await Promise.all(
    positions.map(async (p) => {
      const ticker = Ticker.parse(p.exchange === "BMV" ? `${p.ticker}.MX` : p.ticker);
      let quote: Quote | null = null;
      try {
        quote = await marketData.getQuote(ticker);
      } catch {
        // Tolerar fallos individuales.
      }
      const costBasisMxn = p.quantity * p.avgCostMxn;
      const marketValueMxn = quote ? p.quantity * quote.priceMxn : null;
      const unrealizedPnLMxn = marketValueMxn !== null ? marketValueMxn - costBasisMxn : null;
      const unrealizedPnLPercent =
        unrealizedPnLMxn !== null && costBasisMxn > 0 ? unrealizedPnLMxn / costBasisMxn : null;
      return {
        position: p,
        quote,
        costBasisMxn,
        marketValueMxn,
        unrealizedPnLMxn,
        unrealizedPnLPercent,
      };
    }),
  );
  const totalMarketValue = enriched.reduce((sum, e) => sum + (e.marketValueMxn ?? 0), 0);
  const totalEquity = portfolio.cashBalanceMxn + totalMarketValue;
  const totalReturn = totalEquity - portfolio.initialBalanceMxn;
  const totalReturnPercent =
    portfolio.initialBalanceMxn > 0 ? totalReturn / portfolio.initialBalanceMxn : 0;
  return {
    portfolio,
    positions: enriched,
    totalEquityMxn: totalEquity,
    totalReturnMxn: totalReturn,
    totalReturnPercent,
  };
}
```

- [ ] **Step 4.4: Test de `getPaperPortfolio`** (mínimo 3 tests: portfolio existe con positions, no existe, position sin quote tolerada).

- [ ] **Step 4.5: Implementar `resetPaperPortfolio`**

`src/application/paper-trading/resetPaperPortfolio.ts`:

```ts
import type { PaperPortfolio } from "@/domain/entities/PaperPortfolio";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";

export interface ResetPaperPortfolioArgs {
  userId: string;
  paperPortfolioRepo: PaperPortfolioRepository;
}

/**
 * Resetea el paper portfolio del usuario: borra positions y trades,
 * regresa cashBalance al initialBalance, marca resetAt = now.
 * Operación atómica delegada al repository.
 */
export async function resetPaperPortfolio({
  userId,
  paperPortfolioRepo,
}: ResetPaperPortfolioArgs): Promise<PaperPortfolio> {
  return paperPortfolioRepo.reset(userId);
}
```

- [ ] **Step 4.6: Test de `resetPaperPortfolio`** (1 test: delega al repo).

- [ ] **Step 4.7: Tests pasan**

```bash
pnpm test src/application/paper-trading
```

**Checkpoint Task 4.**

---

## Task 5: API routes `/api/portfolio/*`

**Goal:** Endpoints REST para holdings y trades reales.

**Files:**

- Create: `src/app/api/portfolio/route.ts` (GET)
- Create: `src/app/api/portfolio/trades/route.ts` (POST + GET)

- [ ] **Step 5.1: GET /api/portfolio**

```ts
import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { computePortfolioMetrics } from "@/application/portfolio/computePortfolioMetrics";
import { getHoldings } from "@/application/portfolio/getHoldings";
import { DomainError } from "@/domain/errors/DomainError";
import { requireUserId } from "@/infrastructure/auth/clerk";

/**
 * GET /api/portfolio
 *
 * Regresa los holdings del usuario con cotizaciones actuales y métricas agregadas.
 * Requiere sesión.
 */
export async function GET() {
  try {
    const userId = await requireUserId();
    const { holdings, marketData } = getDeps();
    const enriched = await getHoldings({ userId, holdingRepo: holdings, marketData });
    const metrics = computePortfolioMetrics(enriched);
    return NextResponse.json({ holdings: enriched, metrics });
  } catch (e) {
    return handleApiError(e, "/api/portfolio");
  }
}

function handleApiError(e: unknown, path: string): Response {
  if (e instanceof Error && (e as { status?: number }).status === 401) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (e instanceof DomainError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
  }
  console.error(`${path} error:`, e);
  return NextResponse.json({ error: "internal server error" }, { status: 500 });
}
```

- [ ] **Step 5.2: POST /api/portfolio/trades**

```ts
import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { recordRealTrade } from "@/application/portfolio/recordRealTrade";
import { DomainError } from "@/domain/errors/DomainError";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { recordTradeSchema } from "@/lib/schemas/trade";

/**
 * POST /api/portfolio/trades
 *
 * Registra un trade real ejecutado en GBM+ y actualiza el holding asociado.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = recordTradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { holdings, trades } = getDeps();
    const result = await recordRealTrade({
      input: { userId, ...parsed.data },
      tradeRepo: trades,
      holdingRepo: holdings,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof DomainError) {
      const status = e.code === "INSUFFICIENT_QUANTITY" ? 422 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("/api/portfolio/trades error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/portfolio/trades
 *
 * Lista todos los trades del usuario, ordenados por fecha de ejecución descendente.
 */
export async function GET() {
  try {
    const userId = await requireUserId();
    const { trades } = getDeps();
    const list = await trades.listByUser(userId);
    return NextResponse.json({ trades: list });
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("/api/portfolio/trades GET error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
```

**Checkpoint Task 5.**

---

## Task 6: API routes `/api/paper-trading/*`

**Goal:** Endpoints REST para paper portfolio.

**Files:**

- Create: `src/app/api/paper-trading/route.ts` (GET)
- Create: `src/app/api/paper-trading/trades/route.ts` (POST + GET)
- Create: `src/app/api/paper-trading/reset/route.ts` (POST)

Implementación análoga a `/api/portfolio/*` pero llamando a los use cases de paper-trading. Los códigos HTTP:

- POST trade con InsufficientFundsError → 422
- POST trade con InsufficientQuantityError → 422
- POST reset → 200 con el portfolio reseteado

Seguir patrón del Task 5 para handle de errores.

**Checkpoint Task 6.**

---

## Task 7: Componente `MoneyDisplay` (TDD)

**Goal:** Componente reusable que renderiza una cantidad monetaria con formato `Intl.NumberFormat`, símbolo de moneda, y tipografía mono tabular.

**Files:**

- Create: `src/components/finance/MoneyDisplay/MoneyDisplay.types.ts`
- Create: `src/components/finance/MoneyDisplay/MoneyDisplay.styles.ts`
- Create: `src/components/finance/MoneyDisplay/MoneyDisplay.tsx`
- Create: `src/components/finance/MoneyDisplay/MoneyDisplay.test.tsx`
- Create: `src/components/finance/MoneyDisplay/index.ts`

- [ ] **Step 7.1: types**

```ts
import type { Currency } from "@/domain/value-objects/Money";

export interface MoneyDisplayProps {
  amount: number;
  currency?: Currency;
  /** Cantidad de decimales. Default 2. */
  precision?: number;
  /** Mostrar el código ISO de la moneda al final (ej. "1,234.56 MXN"). Default true. */
  showCurrency?: boolean;
  /** Forzar signo `+` para positivos (útil en deltas). Default false. */
  signed?: boolean;
  /** Tamaño del componente. */
  size?: "sm" | "md" | "lg";
  /** Énfasis visual. */
  emphasis?: "neutral" | "positive" | "negative";
  className?: string;
}
```

- [ ] **Step 7.2: styles**

```ts
import { cva } from "class-variance-authority";

export const moneyDisplayVariants = cva("font-mono tabular-nums", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-2xl font-semibold",
    },
    emphasis: {
      neutral: "text-foreground",
      positive: "text-success",
      negative: "text-destructive",
    },
  },
  defaultVariants: { size: "md", emphasis: "neutral" },
});
```

Nota: si la clase `text-success` no resuelve, agregarla en globals.css o ajustar al token correcto del @theme.

- [ ] **Step 7.3: render**

```tsx
import { cn } from "@/lib/utils";

import { moneyDisplayVariants } from "./MoneyDisplay.styles";
import type { MoneyDisplayProps } from "./MoneyDisplay.types";

/**
 * Renderiza una cantidad monetaria con formato `Intl.NumberFormat`,
 * tipografía mono tabular y soporte de variantes de énfasis (positivo,
 * negativo, neutral).
 */
export function MoneyDisplay({
  amount,
  currency = "MXN",
  precision = 2,
  showCurrency = true,
  signed = false,
  size = "md",
  emphasis = "neutral",
  className,
}: MoneyDisplayProps) {
  const formatter = new Intl.NumberFormat("es-MX", {
    style: "decimal",
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    signDisplay: signed ? "always" : "auto",
  });
  const formatted = formatter.format(amount);
  return (
    <span className={cn(moneyDisplayVariants({ size, emphasis }), className)}>
      {formatted}
      {showCurrency && <span className="text-muted-foreground ml-1 text-xs">{currency}</span>}
    </span>
  );
}
```

- [ ] **Step 7.4: index**

```ts
export { MoneyDisplay } from "./MoneyDisplay";
export type { MoneyDisplayProps } from "./MoneyDisplay.types";
```

- [ ] **Step 7.5: test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MoneyDisplay } from "./MoneyDisplay";

describe("MoneyDisplay", () => {
  it("formatea con dos decimales y separador de miles por default", () => {
    render(<MoneyDisplay amount={1234.5} />);
    expect(screen.getByText(/1,234\.50/)).toBeInTheDocument();
    expect(screen.getByText("MXN")).toBeInTheDocument();
  });

  it("respeta precision custom", () => {
    render(<MoneyDisplay amount={1.2345} precision={4} />);
    expect(screen.getByText(/1\.2345/)).toBeInTheDocument();
  });

  it("muestra signo + cuando signed=true y amount positivo", () => {
    render(<MoneyDisplay amount={100} signed />);
    expect(screen.getByText(/\+100\.00/)).toBeInTheDocument();
  });

  it("oculta currency cuando showCurrency=false", () => {
    render(<MoneyDisplay amount={50} showCurrency={false} />);
    expect(screen.queryByText("MXN")).not.toBeInTheDocument();
  });

  it("aplica variant emphasis", () => {
    const { container } = render(<MoneyDisplay amount={50} emphasis="positive" />);
    expect(container.firstChild).toHaveClass("text-success");
  });
});
```

**Checkpoint Task 7.**

---

## Task 8: Componentes financieros restantes (TDD)

**Goal:** `TickerBadge`, `ExchangeBadge`, `PnLBadge`, `MetricCard`. Cada uno en su folder con types/styles/test/index.

Plantilla para cada componente:

### TickerBadge

Renderiza el ticker en mono uppercase con un border ligero. Props: `ticker: string`, `exchange?: Exchange` (opcional para color tint), `size`, `className`.

### ExchangeBadge

Pill que dice "BMV" o "SIC". Props: `exchange: Exchange`, `size?`, `className?`. Color: BMV verde, SIC azul.

### PnLBadge

Muestra `+1.23%` o `-0.45%` con icono trending up/down y color emphasis automático según el signo. Props: `amount?: number` (MXN), `percent?: number` (decimal o pct), `size`, `className`.

### MetricCard

Card con label arriba (uppercase muted), valor grande mono, opcional delta (mini PnLBadge) y opcional tooltip. Props ricas según el spec:

```ts
export interface MetricCardProps {
  label: string;
  value: number | string;
  format?: "number" | "currency" | "percent";
  precision?: number;
  trend?: "up" | "down" | "flat";
  delta?: number;
  tooltip?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "bordered" | "filled" | "ghost";
  emphasis?: "neutral" | "positive" | "negative";
  className?: string;
}
```

Para cada uno: archivo `.tsx` con render mínimo, `.types.ts`, `.styles.ts` con CVA variants, `index.ts` con barrel export, y `.test.tsx` con al menos 3 tests cubriendo render básico y al menos 2 variantes.

**Checkpoint Task 8.**

---

## Task 9: Componente `DataTable` genérico

**Goal:** DataTable<T> genérica que recibe `data: T[]` y `columns: ColumnDef<T>[]`. Soporta sortable, pagination, empty state, density.

**Files:**

- Create: `src/components/tables/DataTable/DataTable.tsx` + `.types.ts` + `.styles.ts` + `.test.tsx` + `index.ts`

- [ ] **Step 9.1: Instalar `@tanstack/react-table`**

```bash
pnpm add @tanstack/react-table
```

- [ ] **Step 9.2: types**

```ts
import type { ColumnDef } from "@tanstack/react-table";

export type { ColumnDef };

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  /** Habilita ordenamiento por columna. Default true. */
  sortable?: boolean;
  /** Configuración de paginación. Si null, sin paginación. Default null. */
  pagination?: { pageSize: number } | null;
  /** Componente a mostrar cuando data está vacío. */
  emptyState?: React.ReactNode;
  /** Densidad. */
  density?: "compact" | "comfortable";
  className?: string;
}
```

- [ ] **Step 9.3: render**

Implementar usando `useReactTable` + render `<table>`/`<thead>`/`<tbody>` con clases Tailwind. Sortable headers click para alternar dirección. Pagination con prev/next + indicador "página X de Y".

Recordar: el componente NO sabe del dominio. Las columnas se definen en cada uso del DataTable. Es un primitive reusable.

- [ ] **Step 9.4: test**

Mínimo 3 tests: renderiza headers + rows, click en header alterna sort, regresa empty state cuando data vacío.

**Checkpoint Task 9.**

---

## Task 10: Componentes `PortfolioTable` (container + view)

**Goal:** Container que llama hook `usePortfolio()` y pasa props limpias a `PortfolioTableView`. View es 100% testeable sin red.

**Files:**

- Create: `src/components/tables/PortfolioTableView/...` (presentational)
- Create: `src/components/tables/PortfolioTable/...` (container)

### PortfolioTableView

Recibe `data: HoldingWithQuote[]`, `loading: boolean`, `error: string | null`. Renderiza un `DataTable` con columnas: ticker (TickerBadge + ExchangeBadge), quantity, avgCost (MoneyDisplay), price actual (MoneyDisplay con asOf en tooltip), market value (MoneyDisplay size lg), unrealized P&L (PnLBadge).

Si `loading`, muestra skeletons. Si `error`, muestra mensaje.

Tests: render con array vacío, render con holdings, render loading state.

### PortfolioTable (container)

Llama a `usePortfolio()` (Task 12), maneja loading/error/data y pasa al `PortfolioTableView`. Una línea ~10 líneas.

**Checkpoint Task 10.**

---

## Task 11: Componente `TradeForm`

**Goal:** Form con `react-hook-form` + `zodResolver` para registrar un trade real.

**Files:**

- Create: `src/components/forms/TradeForm/...`

- [ ] **Step 11.1: Instalar deps**

```bash
pnpm add react-hook-form @hookform/resolvers
```

- [ ] **Step 11.2: types**

```ts
import type { RecordTradeInput } from "@/lib/schemas/trade";

export interface TradeFormProps {
  /**
   * Acción en el submit. El componente padre se encarga del POST a la API.
   * Recibe los datos validados.
   */
  onSubmit: (data: RecordTradeInput) => Promise<void>;
  /** Valores iniciales (útil para edición futura). */
  defaultValues?: Partial<RecordTradeInput>;
  /** Mostrar el botón cancel. Default true. */
  showCancel?: boolean;
  /** Callback del botón cancel. */
  onCancel?: () => void;
  /** Mostrar campo `commissionMxn`. Default true. */
  showCommission?: boolean;
}
```

- [ ] **Step 11.3: render**

Form con campos:

- ticker (Input)
- exchange (RadioGroup: BMV / SIC)
- action (RadioGroup: BUY / SELL / DIVIDEND)
- quantity (Input number)
- priceMxn (Input number)
- commissionMxn (Input number, condicional)
- executedAt (Input date, default today)
- notes (Textarea)
- Submit + Cancel buttons

Usar `useForm({ resolver: zodResolver(recordTradeSchema), defaultValues })`.

En submit: llamar `onSubmit(data)`. Manejar `isSubmitting` para disable.

Componentes shadcn a usar: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Input`, `RadioGroup`, `RadioGroupItem`, `Textarea`, `Button`. Si no están instalados (de shadcn `add`), instalarlos.

- [ ] **Step 11.4: test**

Render del form, submit dispara onSubmit con data validada, validation falla si ticker vacío.

**Checkpoint Task 11.**

---

## Task 12: Hooks `usePortfolio` y `usePaperPortfolio`

**Files:**

- Create: `src/hooks/usePortfolio.ts`, `src/hooks/usePaperPortfolio.ts`

```ts
// src/hooks/usePortfolio.ts
import { useQuery } from "@tanstack/react-query";

import type { HoldingWithQuote } from "@/application/portfolio/getHoldings";
import type { PortfolioMetrics } from "@/application/portfolio/computePortfolioMetrics";

interface PortfolioResponse {
  holdings: HoldingWithQuote[];
  metrics: PortfolioMetrics;
}

/**
 * Hook que consulta GET /api/portfolio. Cache de TanStack Query.
 */
export function usePortfolio() {
  return useQuery<PortfolioResponse>({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio");
      if (!res.ok) throw new Error("failed to fetch portfolio");
      return res.json();
    },
  });
}
```

`usePaperPortfolio` análogo, llamando a `/api/paper-trading`.

**Checkpoint Task 12.**

---

## Task 13: Página `/portfolio`

**Files:**

- Modify: `src/app/(app)/portfolio/page.tsx` (reemplaza placeholder)

Renderizar:

- Header con título y botón "Registrar trade" → `/portfolio/trade`
- 4 `MetricCard`s: Valor de mercado, Cost basis, P&L sin realizar, P&L %
- `PortfolioTable` con la lista de holdings

Server Component. Usa hooks via Client Component sub-componente (`<PortfolioPageClient />`) que llama a `usePortfolio()`.

**Checkpoint Task 13.**

---

## Task 14: Página `/portfolio/trade`

**Files:**

- Create: `src/app/(app)/portfolio/trade/page.tsx`

Renderiza `<TradeForm onSubmit={handleSubmit} />`. handleSubmit hace `fetch("/api/portfolio/trades", { method: "POST", body: JSON.stringify(data) })`. En éxito: invalidate query `["portfolio"]` + redirect a `/portfolio` con toast de éxito.

**Checkpoint Task 14.**

---

## Task 15: Página `/paper-trading` y subrutas

**Files:**

- Modify: `src/app/(app)/paper-trading/page.tsx`
- Create: `src/app/(app)/paper-trading/trade/page.tsx`
- Create: `src/app/(app)/paper-trading/history/page.tsx`

### `/paper-trading`

Header con título + botones "Hacer trade" y "Reset". 4 MetricCards: Equity total, Cash disponible, Retorno total, Retorno %. Tabla de paper positions (similar a PortfolioTable pero con datos de paper).

### `/paper-trading/trade`

`<PaperTradeForm />` análogo a TradeForm pero con esquema paperTrade.

### `/paper-trading/history`

Tabla con todos los paper trades del usuario, ordenados por fecha desc. Columnas: fecha, ticker, action (badge), quantity, price, total.

**Checkpoint Task 15.**

---

## Task 16: Validación final

```bash
cd /Users/noel/REPOS/BMV-Stock
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Verificar que las nuevas rutas aparezcan en el build:

```
/api/portfolio
/api/portfolio/trades
/api/paper-trading
/api/paper-trading/trades
/api/paper-trading/reset
/portfolio
/portfolio/trade
/paper-trading
/paper-trading/trade
/paper-trading/history
```

Cobertura: ≥90% en `src/application/portfolio/**` y `src/application/paper-trading/**`.

Esperar count de tests > 100.

**Checkpoint final del Plan 3.**

---

## Lo que sigue (Plan 4)

- Watchlist (page + endpoint + componentes).
- Página de análisis `/analysis/[ticker]` con `PriceChart` (Lightweight Charts), indicadores (RSI/MACD/SMA), tooltips educativos en `lib/concepts/`.
- Dashboard real con market snapshot, mini-portfolio, mini-watchlist, últimos trades.
