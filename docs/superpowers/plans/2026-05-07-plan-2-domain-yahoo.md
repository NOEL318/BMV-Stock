# BMV Stock · Plan 2 · Domain + Yahoo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Nota del usuario:** No correr `git commit` automáticamente. Cada tarea termina con un marcador "Checkpoint" que sugiere un buen momento para commitear; el ingeniero decide cuándo hacerlo. Sin emojis en código, comentarios, commits ni output. Comentarios en español con acentos correctos. Identificadores en inglés.

> **Pre-condición:** Plan 1 ejecutado. Si la finalización del Plan 1 (pegar API keys, `pnpm db:migrate`, smoke test) no se ha hecho, este plan se puede empezar igual — solo el endpoint `/api/quotes` requerirá Neon real al final.

**Goal:** Construir la capa de dominio completa (entidades, value objects, errores, ports), el adapter de Yahoo Finance con cache decorator, los use cases de cotizaciones, y el endpoint `/api/quotes?ticker=...` operativo. Activar reglas de ESLint que enforzan las capas de clean architecture.

**Architecture:** Clean architecture estricta. `domain/` puro (cero dependencias externas), `application/` orquesta `domain/` + `domain/ports/` (interfaces), `infrastructure/` implementa los ports y habla con DB y Yahoo. La presentación (`app/api/quotes/route.ts`) llama solo a use cases. Cobertura de tests ≥90% en `domain/` y `application/`.

**Tech Stack:** TypeScript strict, Drizzle ORM (Neon Postgres), `yahoo-finance2` npm package, Vitest + Testing Library. ESLint con `eslint-plugin-import` para enforcer reglas de capas.

**Spec referencia:** `docs/superpowers/specs/2026-05-06-bmv-stock-design.md` (sección 7 Modelo de datos, sección 10 Integraciones externas).

**Plan anterior:** `docs/superpowers/plans/2026-05-06-plan-1-foundation.md`.

---

## File structure que se creará en este plan

```
src/
├── domain/
│   ├── entities/
│   │   ├── Holding.ts
│   │   ├── Holding.test.ts
│   │   ├── Trade.ts
│   │   ├── Trade.test.ts
│   │   ├── PaperPortfolio.ts
│   │   ├── PaperPortfolio.test.ts
│   │   ├── PaperPosition.ts
│   │   ├── PaperTrade.ts
│   │   ├── PaperTrade.test.ts
│   │   ├── WatchlistItem.ts
│   │   ├── UserPreferences.ts
│   │   ├── Quote.ts
│   │   └── HistoricalPrice.ts
│   ├── value-objects/
│   │   ├── Money.ts
│   │   ├── Money.test.ts
│   │   ├── Ticker.ts
│   │   ├── Ticker.test.ts
│   │   ├── Percentage.ts
│   │   └── Percentage.test.ts
│   ├── errors/
│   │   └── DomainError.ts             ← contiene todas las clases de error
│   └── ports/
│       ├── MarketDataProvider.ts
│       ├── HoldingRepository.ts
│       ├── TradeRepository.ts
│       ├── PaperPortfolioRepository.ts
│       ├── PaperPositionRepository.ts
│       ├── PaperTradeRepository.ts
│       ├── WatchlistRepository.ts
│       ├── UserPreferencesRepository.ts
│       └── QuoteCacheRepository.ts
├── application/
│   ├── quotes/
│   │   ├── getQuote.ts
│   │   ├── getQuote.test.ts
│   │   ├── getMarketSnapshot.ts
│   │   ├── getMarketSnapshot.test.ts
│   │   ├── getHistoricalPrices.ts
│   │   └── getHistoricalPrices.test.ts
│   └── di.ts                          ← composition root
├── infrastructure/
│   ├── db/
│   │   ├── schema.ts                  ← extender con todas las tablas
│   │   └── repositories/
│   │       ├── DrizzleHoldingRepository.ts
│   │       ├── DrizzleTradeRepository.ts
│   │       ├── DrizzlePaperPortfolioRepository.ts
│   │       ├── DrizzlePaperPositionRepository.ts
│   │       ├── DrizzlePaperTradeRepository.ts
│   │       ├── DrizzleWatchlistRepository.ts
│   │       ├── DrizzleUserPreferencesRepository.ts
│   │       └── DrizzleQuoteCacheRepository.ts
│   └── market-data/
│       ├── YahooMarketDataProvider.ts
│       └── CachedMarketDataProvider.ts
├── lib/
│   └── schemas/
│       └── quote.ts                   ← Zod schemas compartidos
└── app/
    └── api/
        └── quotes/
            └── route.ts               ← GET /api/quotes?ticker=...

drizzle/
├── 0000_*.sql                         ← ya existe (users)
└── 0001_*.sql                         ← nueva migración con todas las tablas
```

---

## Convenciones de testing

- **Tests unitarios** viven junto al archivo: `Money.ts` + `Money.test.ts`.
- **Vitest** + `expect` API. `describe` + `it` (no `test`).
- **TDD obligatorio para domain y application**: escribir test → ver fallar → implementar mínimo → ver pasar.
- **Coverage objetivo:** ≥90% lines, ≥85% branches en `src/domain/**` y `src/application/**` (ya configurado en `vitest.config.ts`).
- **Repositorios e infraestructura**: tests con mocks o test doubles (no DB real en unit tests). Tests de integración con DB real son responsabilidad del CI o ejecución manual.

---

## Task 1: Activar reglas de capas en ESLint

**Goal:** Forzar las reglas de clean architecture vía lint para que el proyecto no permita imports incorrectos entre capas (ej. `domain/` no puede importar de `infrastructure/`).

**Files:**

- Modify: `eslint.config.mjs`

- [ ] **Step 1.1: Leer el `eslint.config.mjs` actual**

```bash
cat /Users/noel/REPOS/BMV-Stock/eslint.config.mjs
```

Identificar el bloque donde se añaden las rules (debería ser un objeto con `rules: { ... }`).

- [ ] **Step 1.2: Agregar regla `import/no-restricted-paths`**

Editar `eslint.config.mjs`. En el bloque de rules existente, **agregar** la siguiente regla (sin remover las que ya existen):

```js
"import/no-restricted-paths": [
  "error",
  {
    zones: [
      // domain no puede importar de fuera de domain
      {
        target: "./src/domain",
        from: "./src",
        except: ["./domain"],
        message: "domain layer must not depend on application, infrastructure, or app layers",
      },
      // application no puede importar de infrastructure ni app
      {
        target: "./src/application",
        from: "./src/infrastructure",
        message: "application layer must depend only on domain (via ports)",
      },
      {
        target: "./src/application",
        from: "./src/app",
        message: "application layer must not depend on the app/presentation layer",
      },
      {
        target: "./src/application",
        from: "./src/components",
        message: "application layer must not depend on UI components",
      },
      // app y components no deben llamar directo a infrastructure (deben usar application)
      {
        target: "./src/app",
        from: "./src/infrastructure",
        except: ["./src/infrastructure/auth/clerk.ts", "./src/infrastructure/db/client.ts"],
        message: "presentation layer should call use cases in application/, not infrastructure directly",
      },
    ],
  },
],
```

La excepción para `auth/clerk.ts` y `db/client.ts` es pragmática: el `clerkMiddleware` y la composition root sí necesitan importar estos.

- [ ] **Step 1.3: Validar que la regla compila pero no rompe lo existente**

```bash
cd /Users/noel/REPOS/BMV-Stock
pnpm lint
```

Expected: pasa o solo warnings menores. Si hay error de la regla nueva contra código existente del Plan 1, ajustar las excepciones.

**Checkpoint:** Reglas de capas activas.

---

## Task 2: Value Object `Money` (TDD)

**Goal:** Encapsular cantidades monetarias con su currency. Prevenir bugs de mezcla de monedas. API: `add`, `subtract`, `multiply`, `convert(rate)`.

**Files:**

- Create: `src/domain/value-objects/Money.ts`, `src/domain/value-objects/Money.test.ts`

- [ ] **Step 2.1: Escribir el test fallido**

`src/domain/value-objects/Money.test.ts`:

```ts
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
```

- [ ] **Step 2.2: Correr el test, debe fallar**

```bash
pnpm test src/domain/value-objects/Money
```

Expected: FAIL — `Money` no existe aún.

- [ ] **Step 2.3: Implementar `Money`**

`src/domain/value-objects/Money.ts`:

````ts
/**
 * Monedas soportadas por el sistema.
 * Si en el futuro se agregan más (EUR, GBP), extender este tipo.
 */
export type Currency = "MXN" | "USD";

/**
 * Value object que encapsula una cantidad monetaria con su moneda.
 * Inmutable. Prohíbe mezclar monedas sin conversión explícita vía `convert()`.
 *
 * Ejemplo:
 * ```ts
 * const precio = Money.of(69.42, "MXN");
 * const comision = Money.of(0.5, "MXN");
 * const total = precio.add(comision); // Money(69.92, "MXN")
 * ```
 */
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: Currency,
  ) {}

  /**
   * Constructor estático. Preferido sobre `new Money(...)` para legibilidad.
   */
  static of(amount: number, currency: Currency): Money {
    return new Money(amount, currency);
  }

  /**
   * Suma. Lanza si las monedas no coinciden.
   * @throws Error con mensaje "currency mismatch" si las monedas difieren
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amount + other.amount, this.currency);
  }

  /**
   * Resta. Lanza si las monedas no coinciden.
   * @throws Error con mensaje "currency mismatch" si las monedas difieren
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amount - other.amount, this.currency);
  }

  /**
   * Multiplica el monto por un escalar. La moneda no cambia.
   * Útil para calcular `precio * cantidad` o aplicar un porcentaje.
   */
  multiply(scalar: number): Money {
    return Money.of(this.amount * scalar, this.currency);
  }

  /**
   * Convierte a otra moneda multiplicando por una tasa.
   * Para convertir de la misma moneda a la misma, pasar rate=1.
   *
   * @param rate - tasa de conversión (debe ser > 0)
   * @param target - moneda destino
   * @throws Error si rate <= 0
   */
  convert(rate: number, target: Currency): Money {
    if (rate <= 0) {
      throw new Error("rate must be positive");
    }
    return Money.of(this.amount * rate, target);
  }

  /**
   * Compara igualdad estructural (amount + currency).
   */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `currency mismatch: cannot operate on ${this.currency} and ${other.currency}`,
      );
    }
  }
}
````

- [ ] **Step 2.4: Correr tests, deben pasar**

```bash
pnpm test src/domain/value-objects/Money
```

Expected: 13 tests passed.

**Checkpoint:** `Money` implementado y testeado.

---

## Task 3: Value Object `Ticker` (TDD)

**Goal:** Encapsular un ticker (símbolo bursátil) con validación de formato y detección automática de exchange (BMV vs SIC).

**Files:**

- Create: `src/domain/value-objects/Ticker.ts`, `src/domain/value-objects/Ticker.test.ts`

- [ ] **Step 3.1: Escribir el test fallido**

`src/domain/value-objects/Ticker.test.ts`:

```ts
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
```

- [ ] **Step 3.2: Correr test, debe fallar**

```bash
pnpm test src/domain/value-objects/Ticker
```

- [ ] **Step 3.3: Implementar `Ticker`**

`src/domain/value-objects/Ticker.ts`:

```ts
/**
 * Bolsas soportadas por el sistema.
 * - BMV: Bolsa Mexicana de Valores (sufijo `.MX` en Yahoo Finance)
 * - SIC: Sistema Internacional de Cotizaciones (acciones de EUA listadas en BMV
 *   pero el dato real viene del listing original USA, ej. AAPL, SPY)
 */
export type Exchange = "BMV" | "SIC";

/**
 * Regex para validar la parte del symbol. Solo letras y dígitos.
 */
const SYMBOL_REGEX = /^[A-Z0-9]+$/;

/**
 * Value object que representa un ticker bursátil con su exchange y formato
 * para Yahoo Finance.
 *
 * Convención:
 * - BMV: el usuario escribe `WALMEX.MX` o `walmex.mx`, se normaliza a `WALMEX.MX`.
 * - SIC: el usuario escribe `AAPL` o `aapl`, se normaliza a `AAPL`.
 *
 * Yahoo Finance espera el sufijo `.MX` para BMV; los SIC usan el ticker USA original.
 */
export class Ticker {
  private constructor(
    public readonly symbol: string,
    public readonly exchange: Exchange,
  ) {}

  /**
   * Parsea un string a `Ticker`. Soporta entrada en cualquier capitalización.
   * Detecta exchange:
   * - Sufijo `.MX` (case-insensitive) → BMV
   * - Sin sufijo → SIC
   *
   * @throws Error si el ticker está vacío, contiene caracteres inválidos,
   *         o tiene un sufijo distinto a `.MX`.
   */
  static parse(raw: string): Ticker {
    const trimmed = raw.trim().toUpperCase();
    if (trimmed.length === 0) {
      throw new Error("ticker cannot be empty");
    }

    const dotCount = (trimmed.match(/\./g) ?? []).length;
    if (dotCount > 1) {
      throw new Error(`invalid ticker format: "${raw}" has too many dots`);
    }

    if (dotCount === 1) {
      const [symbol, suffix] = trimmed.split(".");
      if (suffix !== "MX") {
        throw new Error(`invalid ticker suffix: "${suffix}" (only .MX is supported)`);
      }
      if (!symbol || !SYMBOL_REGEX.test(symbol)) {
        throw new Error(`invalid ticker symbol: "${raw}"`);
      }
      return new Ticker(symbol, "BMV");
    }

    if (!SYMBOL_REGEX.test(trimmed)) {
      throw new Error(`invalid ticker symbol: "${raw}"`);
    }
    return new Ticker(trimmed, "SIC");
  }

  /**
   * Formato esperado por Yahoo Finance.
   * BMV: `SYMBOL.MX`. SIC: `SYMBOL`.
   */
  get yahooSymbol(): string {
    return this.exchange === "BMV" ? `${this.symbol}.MX` : this.symbol;
  }

  /**
   * Igualdad estructural.
   */
  equals(other: Ticker): boolean {
    return this.symbol === other.symbol && this.exchange === other.exchange;
  }

  /**
   * Representación en string (igual a `yahooSymbol`).
   */
  toString(): string {
    return this.yahooSymbol;
  }
}
```

- [ ] **Step 3.4: Correr tests, deben pasar**

```bash
pnpm test src/domain/value-objects/Ticker
```

Expected: ~16 tests passed.

**Checkpoint:** `Ticker` implementado y testeado.

---

## Task 4: Value Object `Percentage` (TDD)

**Goal:** Evitar bugs de "¿es 0.05 o 5?" en cálculos de porcentajes.

**Files:**

- Create: `src/domain/value-objects/Percentage.ts`, `src/domain/value-objects/Percentage.test.ts`

- [ ] **Step 4.1: Escribir el test fallido**

`src/domain/value-objects/Percentage.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { Percentage } from "./Percentage";

describe("Percentage", () => {
  it("fromDecimal interpreta 0.05 como 5%", () => {
    const p = Percentage.fromDecimal(0.05);
    expect(p.asPercent).toBe(5);
    expect(p.asDecimal).toBe(0.05);
  });

  it("fromPercent interpreta 5 como 5%", () => {
    const p = Percentage.fromPercent(5);
    expect(p.asPercent).toBe(5);
    expect(p.asDecimal).toBe(0.05);
  });

  it("fromPercent acepta valores fraccionarios", () => {
    const p = Percentage.fromPercent(2.5);
    expect(p.asDecimal).toBeCloseTo(0.025, 5);
  });

  it("fromPercent acepta valores negativos (caídas)", () => {
    const p = Percentage.fromPercent(-3.2);
    expect(p.asDecimal).toBeCloseTo(-0.032, 5);
  });

  it("apply multiplica un número por la fracción decimal", () => {
    const p = Percentage.fromPercent(10);
    expect(p.apply(100)).toBe(10);
    expect(p.apply(250)).toBe(25);
  });

  it("toString formatea con signo y dos decimales", () => {
    expect(Percentage.fromPercent(5).toString()).toBe("+5.00%");
    expect(Percentage.fromPercent(-3.2).toString()).toBe("-3.20%");
    expect(Percentage.fromPercent(0).toString()).toBe("0.00%");
  });

  it("equals compara con tolerancia mínima", () => {
    expect(Percentage.fromPercent(5).equals(Percentage.fromPercent(5))).toBe(true);
    expect(Percentage.fromPercent(5).equals(Percentage.fromPercent(5.0001))).toBe(false);
  });
});
```

- [ ] **Step 4.2: Correr test, debe fallar**

```bash
pnpm test src/domain/value-objects/Percentage
```

- [ ] **Step 4.3: Implementar `Percentage`**

`src/domain/value-objects/Percentage.ts`:

```ts
/**
 * Value object para representar porcentajes sin ambigüedad.
 * Internamente almacena el valor como fracción decimal (0.05 = 5%).
 *
 * Construir con `fromPercent(5)` para 5%, o con `fromDecimal(0.05)` para
 * el mismo 5%. Esto evita el bug clásico de "¿está en 0..1 o en 0..100?".
 */
export class Percentage {
  private constructor(private readonly _decimal: number) {}

  /**
   * Crea un Percentage desde un valor en formato decimal (ej. 0.05 = 5%).
   */
  static fromDecimal(decimal: number): Percentage {
    return new Percentage(decimal);
  }

  /**
   * Crea un Percentage desde un valor "humano" (ej. 5 = 5%).
   */
  static fromPercent(percent: number): Percentage {
    return new Percentage(percent / 100);
  }

  /**
   * Valor en formato decimal (5% = 0.05).
   */
  get asDecimal(): number {
    return this._decimal;
  }

  /**
   * Valor en formato "humano" (0.05 = 5).
   */
  get asPercent(): number {
    return this._decimal * 100;
  }

  /**
   * Aplica el porcentaje a una cantidad (multiplica por la fracción decimal).
   * Ejemplo: `fromPercent(10).apply(250)` → 25.
   */
  apply(amount: number): number {
    return amount * this._decimal;
  }

  /**
   * Igualdad estructural.
   */
  equals(other: Percentage): boolean {
    return this._decimal === other._decimal;
  }

  /**
   * Formato `+X.XX%` o `-X.XX%`.
   */
  toString(): string {
    const pct = this.asPercent;
    if (pct === 0) return "0.00%";
    const sign = pct > 0 ? "+" : "";
    return `${sign}${pct.toFixed(2)}%`;
  }
}
```

- [ ] **Step 4.4: Correr tests, deben pasar**

```bash
pnpm test src/domain/value-objects/Percentage
```

**Checkpoint:** Tres value objects completos.

---

## Task 5: Domain errors

**Goal:** Definir todos los errores del dominio en un solo archivo. Cada error es una clase con un nombre descriptivo y un mensaje útil.

**Files:**

- Create: `src/domain/errors/DomainError.ts`

- [ ] **Step 5.1: Implementar las clases de error**

`src/domain/errors/DomainError.ts`:

```ts
/**
 * Error base de todos los errores del dominio.
 * Sirve para discriminar errores propios vs errores de runtime arbitrarios
 * en los handlers de la capa de presentación.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Se lanza cuando un paper trade BUY no tiene fondos suficientes en
 * `cashBalanceMxn` del PaperPortfolio.
 */
export class InsufficientFundsError extends DomainError {
  readonly code = "INSUFFICIENT_FUNDS";

  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(
      `insufficient funds: required ${required.toFixed(2)} MXN, available ${available.toFixed(2)} MXN`,
    );
  }
}

/**
 * Se lanza al intentar vender más cantidad de la que se posee en una posición.
 */
export class InsufficientQuantityError extends DomainError {
  readonly code = "INSUFFICIENT_QUANTITY";

  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(`insufficient quantity: required ${required}, available ${available}`);
  }
}

/**
 * Se lanza cuando un ticker no pasa la validación de formato.
 * Distinto de `TickerNotFoundError` (ese aplica cuando Yahoo no conoce el ticker).
 */
export class InvalidTickerError extends DomainError {
  readonly code = "INVALID_TICKER";

  constructor(
    public readonly raw: string,
    reason: string,
  ) {
    super(`invalid ticker "${raw}": ${reason}`);
  }
}

/**
 * Se lanza cuando Yahoo (o cualquier MarketDataProvider) no encuentra el ticker.
 */
export class TickerNotFoundError extends DomainError {
  readonly code = "TICKER_NOT_FOUND";

  constructor(public readonly ticker: string) {
    super(`ticker not found: ${ticker}`);
  }
}

/**
 * Se lanza cuando la fuente de datos de mercado está caída o devuelve error
 * inesperado. Incluye un mensaje amigable para mostrar en UI.
 */
export class MarketDataUnavailableError extends DomainError {
  readonly code = "MARKET_DATA_UNAVAILABLE";

  constructor(
    public readonly providerName: string,
    public readonly cause?: unknown,
  ) {
    super(`market data unavailable from ${providerName}`);
  }
}

/**
 * Se lanza al intentar acceder a recursos sin sesión.
 * La mayoría de las veces se traduce a HTTP 401 en la capa de presentación.
 */
export class UnauthorizedError extends DomainError {
  readonly code = "UNAUTHORIZED";

  constructor(message = "unauthorized") {
    super(message);
  }
}
```

- [ ] **Step 5.2: Validar typecheck**

```bash
pnpm typecheck
```

**Checkpoint:** Errores del dominio definidos.

---

## Task 6: Entities — `Trade` y `Holding` (TDD)

**Goal:** Definir los tipos `Trade` y `Holding` y la lógica de cómo un trade actualiza un holding (promedio ponderado).

**Files:**

- Create: `src/domain/entities/Trade.ts`, `src/domain/entities/Trade.test.ts`
- Create: `src/domain/entities/Holding.ts`, `src/domain/entities/Holding.test.ts`

- [ ] **Step 6.1: Implementar `Trade` (sin tests propios — es un tipo de datos)**

`src/domain/entities/Trade.ts`:

```ts
import type { Exchange } from "../value-objects/Ticker";

/**
 * Acciones posibles en un trade real.
 * - BUY: compra que aumenta cantidad y recalcula avgCost.
 * - SELL: venta que disminuye cantidad. avgCost no cambia.
 * - DIVIDEND: dividendo recibido. No afecta cantidad ni avgCost; queda para
 *   historial y para cálculo futuro de yield.
 */
export type TradeAction = "BUY" | "SELL" | "DIVIDEND";

/**
 * Trade real registrado por el usuario después de ejecutarlo en GBM+.
 * Inmutable; corregir errores requiere insertar un trade compensatorio.
 */
export interface Trade {
  id: string;
  userId: string;
  ticker: string;
  exchange: Exchange;
  action: TradeAction;
  /** Cantidad de unidades (acciones, ETFs). Para DIVIDEND se usa qty=1. */
  quantity: number;
  /** Precio por unidad en MXN. Para DIVIDEND se usa el monto total recibido. */
  priceMxn: number;
  /** Comisión cobrada por el bróker en MXN. Default 0 si GBM no cobra. */
  commissionMxn: number;
  /** Cuándo ocurrió el trade en GBM+ (no cuándo se registró). */
  executedAt: Date;
  notes: string | null;
  createdAt: Date;
}
```

- [ ] **Step 6.2: Escribir test para `Holding` con la lógica de recálculo**

`src/domain/entities/Holding.test.ts`:

```ts
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
```

- [ ] **Step 6.3: Correr test, debe fallar**

```bash
pnpm test src/domain/entities/Holding
```

- [ ] **Step 6.4: Implementar `Holding`**

`src/domain/entities/Holding.ts`:

```ts
import { InsufficientQuantityError } from "../errors/DomainError";
import type { Exchange } from "../value-objects/Ticker";

import type { Trade } from "./Trade";

/**
 * Posición real actual del usuario en una emisora.
 * Vista derivada de la suma de Trades; el sistema la mantiene actualizada
 * tras ejecutar cada trade.
 */
export interface Holding {
  id: string;
  userId: string;
  ticker: string;
  exchange: Exchange;
  /** Cantidad actual. Cuando llega a 0, el holding se marca con closedAt. */
  quantity: number;
  /** Costo promedio por unidad en MXN, calculado como promedio ponderado. */
  avgCostMxn: number;
  /** Fecha del primer BUY que abrió esta posición. */
  openedAt: Date;
  /** Si quantity llegó a 0 por ventas, fecha del SELL que la cerró. */
  closedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Crea un Holding nuevo a partir de un trade BUY inicial.
 * El avgCost incluye la comisión prorrateada por unidad.
 *
 * @throws Error si el trade no es BUY
 */
export function createHoldingFromBuy(
  trade: Trade,
): Omit<Holding, "id" | "createdAt" | "updatedAt"> {
  if (trade.action !== "BUY") {
    throw new Error(`createHoldingFromBuy requires action=BUY, got ${trade.action}`);
  }
  const totalCost = trade.quantity * trade.priceMxn + trade.commissionMxn;
  return {
    userId: trade.userId,
    ticker: trade.ticker,
    exchange: trade.exchange,
    quantity: trade.quantity,
    avgCostMxn: totalCost / trade.quantity,
    openedAt: trade.executedAt,
    closedAt: null,
    notes: null,
  };
}

/**
 * Aplica un trade a un holding existente y devuelve el holding actualizado.
 * No muta el holding original.
 *
 * Reglas:
 * - BUY: avgCost = (oldQty*oldAvg + newQty*price + commission) / (oldQty + newQty).
 *   La cantidad aumenta.
 * - SELL: cantidad disminuye. avgCost no cambia. Si quantity llega a 0, se marca closedAt.
 *   Si trade.quantity > holding.quantity, lanza InsufficientQuantityError.
 * - DIVIDEND: el holding no cambia.
 *
 * @throws InsufficientQuantityError si SELL excede la cantidad disponible
 */
export function applyTradeToHolding(holding: Holding, trade: Trade): Holding {
  switch (trade.action) {
    case "BUY": {
      const oldTotalCost = holding.quantity * holding.avgCostMxn;
      const tradeTotalCost = trade.quantity * trade.priceMxn + trade.commissionMxn;
      const newQuantity = holding.quantity + trade.quantity;
      const newAvgCost = (oldTotalCost + tradeTotalCost) / newQuantity;
      return {
        ...holding,
        quantity: newQuantity,
        avgCostMxn: newAvgCost,
        updatedAt: trade.executedAt,
      };
    }
    case "SELL": {
      if (trade.quantity > holding.quantity) {
        throw new InsufficientQuantityError(trade.quantity, holding.quantity);
      }
      const newQuantity = holding.quantity - trade.quantity;
      return {
        ...holding,
        quantity: newQuantity,
        closedAt: newQuantity === 0 ? trade.executedAt : holding.closedAt,
        updatedAt: trade.executedAt,
      };
    }
    case "DIVIDEND":
      return holding;
  }
}
```

- [ ] **Step 6.5: Correr tests, deben pasar**

```bash
pnpm test src/domain/entities/Holding
```

Expected: 7 tests passed.

**Checkpoint:** Trade y Holding completos.

---

## Task 7: Entities — Paper trading (TDD)

**Goal:** `PaperPortfolio`, `PaperPosition`, `PaperTrade` con la lógica de validación de fondos y aplicación de trades simulados.

**Files:**

- Create: `src/domain/entities/PaperPortfolio.ts`, `src/domain/entities/PaperPortfolio.test.ts`
- Create: `src/domain/entities/PaperPosition.ts`
- Create: `src/domain/entities/PaperTrade.ts`, `src/domain/entities/PaperTrade.test.ts`

- [ ] **Step 7.1: Implementar tipos `PaperTrade`, `PaperPosition`, `PaperPortfolio`**

`src/domain/entities/PaperTrade.ts`:

```ts
import type { Exchange } from "../value-objects/Ticker";

/**
 * Acciones permitidas en paper trading. No hay DIVIDEND (no se simulan dividendos en v1).
 */
export type PaperTradeAction = "BUY" | "SELL";

/**
 * Trade simulado en el portafolio paper. Sin comisión.
 */
export interface PaperTrade {
  id: string;
  paperPortfolioId: string;
  ticker: string;
  exchange: Exchange;
  action: PaperTradeAction;
  quantity: number;
  priceMxn: number;
  executedAt: Date;
  notes: string | null;
  createdAt: Date;
}
```

`src/domain/entities/PaperPosition.ts`:

```ts
import type { Exchange } from "../value-objects/Ticker";

/**
 * Posición simulada actual en el portafolio paper.
 * Misma estructura conceptual que `Holding` pero ligada a un PaperPortfolio.
 */
export interface PaperPosition {
  id: string;
  paperPortfolioId: string;
  ticker: string;
  exchange: Exchange;
  quantity: number;
  avgCostMxn: number;
  openedAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

`src/domain/entities/PaperPortfolio.ts`:

```ts
import { InsufficientFundsError, InsufficientQuantityError } from "../errors/DomainError";

import type { PaperPosition } from "./PaperPosition";
import type { PaperTrade } from "./PaperTrade";

/**
 * Portafolio simulado del usuario. Un solo PaperPortfolio por usuario en v1.
 * cashBalanceMxn arranca en 100,000 (definido en el spec).
 */
export interface PaperPortfolio {
  id: string;
  userId: string;
  name: string;
  cashBalanceMxn: number;
  initialBalanceMxn: number;
  createdAt: Date;
  resetAt: Date | null;
}

/**
 * Resultado de aplicar un paper trade a un portfolio + posición.
 * El consumer (use case) decide cómo persistir.
 */
export interface PaperTradeOutcome {
  portfolio: PaperPortfolio;
  position: PaperPosition;
}

/**
 * Aplica un paper trade BUY al portfolio y a la posición existente (si la hay).
 * Si no hay posición previa, crea una nueva.
 *
 * Valida:
 * - cashBalanceMxn >= qty * priceMxn  → si no, InsufficientFundsError.
 *
 * No muta los argumentos.
 */
export function applyPaperBuy(
  portfolio: PaperPortfolio,
  trade: PaperTrade,
  existing: PaperPosition | null,
): PaperTradeOutcome {
  if (trade.action !== "BUY") {
    throw new Error(`applyPaperBuy requires action=BUY, got ${trade.action}`);
  }
  const cost = trade.quantity * trade.priceMxn;
  if (portfolio.cashBalanceMxn < cost) {
    throw new InsufficientFundsError(cost, portfolio.cashBalanceMxn);
  }
  const updatedPortfolio: PaperPortfolio = {
    ...portfolio,
    cashBalanceMxn: portfolio.cashBalanceMxn - cost,
  };
  let position: PaperPosition;
  if (existing && existing.quantity > 0) {
    const oldTotalCost = existing.quantity * existing.avgCostMxn;
    const newQuantity = existing.quantity + trade.quantity;
    const newAvgCost = (oldTotalCost + cost) / newQuantity;
    position = {
      ...existing,
      quantity: newQuantity,
      avgCostMxn: newAvgCost,
      updatedAt: trade.executedAt,
    };
  } else {
    position = {
      id: existing?.id ?? "",
      paperPortfolioId: portfolio.id,
      ticker: trade.ticker,
      exchange: trade.exchange,
      quantity: trade.quantity,
      avgCostMxn: trade.priceMxn,
      openedAt: trade.executedAt,
      closedAt: null,
      createdAt: trade.executedAt,
      updatedAt: trade.executedAt,
    };
  }
  return { portfolio: updatedPortfolio, position };
}

/**
 * Aplica un paper trade SELL al portfolio y la posición.
 *
 * Valida:
 * - existing.quantity >= trade.quantity → si no, InsufficientQuantityError.
 *
 * Aumenta cashBalanceMxn por qty * priceMxn (sin comisión).
 * Si la cantidad llega a 0, la posición se marca con closedAt.
 */
export function applyPaperSell(
  portfolio: PaperPortfolio,
  trade: PaperTrade,
  existing: PaperPosition,
): PaperTradeOutcome {
  if (trade.action !== "SELL") {
    throw new Error(`applyPaperSell requires action=SELL, got ${trade.action}`);
  }
  if (trade.quantity > existing.quantity) {
    throw new InsufficientQuantityError(trade.quantity, existing.quantity);
  }
  const proceeds = trade.quantity * trade.priceMxn;
  const newQuantity = existing.quantity - trade.quantity;
  return {
    portfolio: {
      ...portfolio,
      cashBalanceMxn: portfolio.cashBalanceMxn + proceeds,
    },
    position: {
      ...existing,
      quantity: newQuantity,
      closedAt: newQuantity === 0 ? trade.executedAt : existing.closedAt,
      updatedAt: trade.executedAt,
    },
  };
}
```

- [ ] **Step 7.2: Tests para `PaperPortfolio`**

`src/domain/entities/PaperPortfolio.test.ts`:

```ts
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
});
```

- [ ] **Step 7.3: Correr tests, deben pasar**

```bash
pnpm test src/domain/entities/PaperPortfolio
```

Expected: 6 tests passed.

**Checkpoint:** Paper trading entities completas.

---

## Task 8: Entities — Watchlist, UserPreferences, Quote, HistoricalPrice

**Goal:** Tipos puros de datos sin lógica compleja.

**Files:**

- Create: `src/domain/entities/WatchlistItem.ts`
- Create: `src/domain/entities/UserPreferences.ts`
- Create: `src/domain/entities/Quote.ts`
- Create: `src/domain/entities/HistoricalPrice.ts`

- [ ] **Step 8.1: Implementar `WatchlistItem`**

`src/domain/entities/WatchlistItem.ts`:

```ts
import type { Exchange } from "../value-objects/Ticker";

/**
 * Item en el watchlist del usuario. Los campos `alertPriceAbove`/`Below` son
 * v2 (la lógica de notificación no existe en v1).
 */
export interface WatchlistItem {
  id: string;
  userId: string;
  ticker: string;
  exchange: Exchange;
  alertPriceAbove: number | null;
  alertPriceBelow: number | null;
  notes: string | null;
  addedAt: Date;
}
```

- [ ] **Step 8.2: Implementar `UserPreferences`**

`src/domain/entities/UserPreferences.ts`:

```ts
import type { Currency } from "../value-objects/Money";

export type Timeframe = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "5Y";
export type Theme = "light" | "dark" | "system";
export type TableDensity = "compact" | "comfortable";
export type RiskProfile = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";

/**
 * Preferencias del usuario, persistidas en DB y editables desde /settings.
 * `disclaimerAcceptedAt = null` significa que el usuario no ha aceptado el
 * modal de disclaimer en su primer login.
 */
export interface UserPreferences {
  userId: string;
  displayCurrency: Currency;
  defaultTimeframe: Timeframe;
  theme: Theme;
  tableDensity: TableDensity;
  riskProfile: RiskProfile;
  disclaimerAcceptedAt: Date | null;
}

/**
 * Valores default usados al crear UserPreferences para un usuario nuevo.
 */
export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, "userId"> = {
  displayCurrency: "MXN",
  defaultTimeframe: "3M",
  theme: "system",
  tableDensity: "comfortable",
  riskProfile: "MODERATE",
  disclaimerAcceptedAt: null,
};
```

- [ ] **Step 8.3: Implementar `Quote`**

`src/domain/entities/Quote.ts`:

```ts
import type { Exchange } from "../value-objects/Ticker";

/**
 * Cotización en tiempo casi-real de una emisora.
 * Para tickers SIC, `priceUsd` viene del listing original USA y `priceMxn`
 * se calcula al spot del día. Para BMV solo se usa priceMxn.
 */
export interface Quote {
  ticker: string;
  exchange: Exchange;
  /** Precio actual en MXN (canónico para la app). */
  priceMxn: number;
  /** Precio en USD si es SIC; null si es BMV. */
  priceUsd: number | null;
  openMxn: number;
  highMxn: number;
  lowMxn: number;
  /** Volumen del día (acciones, no MXN). */
  volume: number;
  /** Timestamp del dato según Yahoo (puede tener delay de ~15-20 min). */
  asOf: Date;
}
```

- [ ] **Step 8.4: Implementar `HistoricalPrice`**

`src/domain/entities/HistoricalPrice.ts`:

```ts
import type { Exchange } from "../value-objects/Ticker";

/**
 * OHLCV diario para un ticker. Se persiste en `historical_price` en DB
 * para evitar pegar a Yahoo cada vez que se renderiza una gráfica.
 */
export interface HistoricalPrice {
  ticker: string;
  exchange: Exchange;
  /** Fecha del candle (ISO date sin hora). */
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Rango temporal soportado por las gráficas. Se mapea a un número de días
 * en la implementación de `getHistoricalPrices`.
 */
export type TimeRange = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "ALL";
```

- [ ] **Step 8.5: Validar typecheck**

```bash
pnpm typecheck
```

**Checkpoint:** Entidades restantes definidas.

---

## Task 9: Domain ports (interfaces)

**Goal:** Definir las interfaces que `infrastructure/` implementará. `domain/` y `application/` solo dependen de estas interfaces, nunca de implementaciones concretas.

**Files:**

- Create todas las interfaces en `src/domain/ports/`

- [ ] **Step 9.1: `MarketDataProvider`**

`src/domain/ports/MarketDataProvider.ts`:

```ts
import type { HistoricalPrice, TimeRange } from "../entities/HistoricalPrice";
import type { Quote } from "../entities/Quote";
import type { Ticker } from "../value-objects/Ticker";

/**
 * Snapshot del mercado: cotizaciones agregadas para los benchmarks que
 * mostramos en el dashboard (IPC, USDMXN, S&P 500, NASDAQ).
 */
export interface MarketSnapshot {
  ipc: Quote;
  usdMxn: Quote;
  sp500: Quote;
  nasdaq: Quote;
}

/**
 * Puerto para obtener datos de mercado.
 * Implementaciones esperadas:
 * - `YahooMarketDataProvider` (infra) usa la librería yahoo-finance2.
 * - `CachedMarketDataProvider` (infra) decora otra implementación con cache en DB.
 */
export interface MarketDataProvider {
  getQuote(ticker: Ticker): Promise<Quote>;
  getHistorical(ticker: Ticker, range: TimeRange): Promise<HistoricalPrice[]>;
  getMarketSnapshot(): Promise<MarketSnapshot>;
}
```

- [ ] **Step 9.2: Repositories de cada entidad**

Crear los siguientes archivos. Cada uno define una interfaz con métodos CRUD básicos. Plantilla:

```ts
// src/domain/ports/HoldingRepository.ts
import type { Holding } from "../entities/Holding";
import type { Exchange } from "../value-objects/Ticker";

export interface HoldingRepository {
  /** Lista los holdings activos (closedAt null) y opcionalmente cerrados. */
  listByUser(userId: string, options?: { includeClosed?: boolean }): Promise<Holding[]>;
  findById(id: string): Promise<Holding | null>;
  /**
   * Busca por la combinación única (userId, ticker, exchange).
   * Necesita exchange porque un mismo símbolo puede existir teóricamente
   * en BMV y SIC distintamente.
   */
  findByTickerAndExchange(
    userId: string,
    ticker: string,
    exchange: Exchange,
  ): Promise<Holding | null>;
  /** Crea un holding nuevo. Asigna id y timestamps. */
  create(input: Omit<Holding, "id" | "createdAt" | "updatedAt">): Promise<Holding>;
  /** Reemplaza el holding completo (after applying a trade). */
  update(holding: Holding): Promise<Holding>;
}
```

Crear los siguientes con APIs análogas:

- `src/domain/ports/TradeRepository.ts` con `listByUser(userId)`, `findById(id)`, `create(input: Omit<Trade, "id" | "createdAt">)`. No tiene `update` (los trades son inmutables).

- `src/domain/ports/PaperPortfolioRepository.ts` con `findByUser(userId)`, `create(input)`, `update(portfolio)`, `reset(userId)` (regresa a initialBalanceMxn y borra positions/trades).

- `src/domain/ports/PaperPositionRepository.ts` análogo a `HoldingRepository` pero con `paperPortfolioId` en vez de `userId`.

- `src/domain/ports/PaperTradeRepository.ts` análogo a `TradeRepository`.

- `src/domain/ports/WatchlistRepository.ts` con `listByUser(userId)`, `findByTicker(userId, ticker)`, `create(input)`, `delete(id)`, `update(item)`.

- `src/domain/ports/UserPreferencesRepository.ts` con `findByUser(userId)`, `upsert(prefs)`.

- `src/domain/ports/QuoteCacheRepository.ts` con `find(ticker, exchange)` (regresa null si expirado), `upsert(quote)`, `findHistorical(ticker, exchange, fromDate, toDate)`, `upsertHistorical(prices)`.

Para cada archivo, escribir TSDoc explicando el propósito de cada método con la convención del archivo `HoldingRepository.ts` arriba.

- [ ] **Step 9.3: Validar typecheck**

```bash
pnpm typecheck
```

Expected: pasa. Estos son solo tipos.

**Checkpoint:** Ports definidos. Domain layer completa.

---

## Task 10: Drizzle schema completo

**Goal:** Extender el schema de Drizzle (que solo tenía `users` del Plan 1) con todas las tablas necesarias. Generar la migración.

**Files:**

- Modify: `src/infrastructure/db/schema.ts`

- [ ] **Step 10.1: Reemplazar el schema completo**

`src/infrastructure/db/schema.ts`:

```ts
import { sql } from "drizzle-orm";
import {
  bigint,
  date,
  doublePrecision,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Enums de Postgres para columnas con valores discretos.
 */
export const exchangeEnum = pgEnum("exchange", ["BMV", "SIC"]);
export const tradeActionEnum = pgEnum("trade_action", ["BUY", "SELL", "DIVIDEND"]);
export const paperTradeActionEnum = pgEnum("paper_trade_action", ["BUY", "SELL"]);
export const currencyEnum = pgEnum("currency", ["MXN", "USD"]);
export const themeEnum = pgEnum("theme", ["light", "dark", "system"]);
export const tableDensityEnum = pgEnum("table_density", ["compact", "comfortable"]);
export const riskProfileEnum = pgEnum("risk_profile", ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]);
export const timeframeEnum = pgEnum("timeframe", ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"]);

/**
 * Espejo del usuario de Clerk.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Posiciones reales del usuario. Vista derivada de los trades.
 */
export const holdings = pgTable(
  "holdings",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    avgCostMxn: numeric("avg_cost_mxn", { precision: 20, scale: 4 }).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userTickerIdx: uniqueIndex("holdings_user_ticker_idx").on(t.userId, t.ticker, t.exchange),
    userIdx: index("holdings_user_idx").on(t.userId),
  }),
);

/**
 * Bitácora inmutable de trades reales. La fuente de verdad.
 */
export const trades = pgTable(
  "trades",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    action: tradeActionEnum("action").notNull(),
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    priceMxn: numeric("price_mxn", { precision: 20, scale: 4 }).notNull(),
    commissionMxn: numeric("commission_mxn", { precision: 20, scale: 4 }).notNull().default("0"),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userExecutedAtIdx: index("trades_user_executed_at_idx").on(t.userId, t.executedAt),
  }),
);

/**
 * Portafolio paper (simulado). Un solo registro por usuario en v1.
 */
export const paperPortfolios = pgTable("paper_portfolios", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Mi portafolio de práctica"),
  cashBalanceMxn: numeric("cash_balance_mxn", { precision: 20, scale: 2 })
    .notNull()
    .default("100000"),
  initialBalanceMxn: numeric("initial_balance_mxn", { precision: 20, scale: 2 })
    .notNull()
    .default("100000"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resetAt: timestamp("reset_at", { withTimezone: true }),
});

export const paperPositions = pgTable(
  "paper_positions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    paperPortfolioId: text("paper_portfolio_id")
      .notNull()
      .references(() => paperPortfolios.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    avgCostMxn: numeric("avg_cost_mxn", { precision: 20, scale: 4 }).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    portfolioTickerIdx: uniqueIndex("paper_positions_portfolio_ticker_idx").on(
      t.paperPortfolioId,
      t.ticker,
      t.exchange,
    ),
  }),
);

export const paperTrades = pgTable(
  "paper_trades",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    paperPortfolioId: text("paper_portfolio_id")
      .notNull()
      .references(() => paperPortfolios.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    action: paperTradeActionEnum("action").notNull(),
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    priceMxn: numeric("price_mxn", { precision: 20, scale: 4 }).notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    portfolioExecutedAtIdx: index("paper_trades_portfolio_executed_at_idx").on(
      t.paperPortfolioId,
      t.executedAt,
    ),
  }),
);

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    alertPriceAbove: numeric("alert_price_above", { precision: 20, scale: 4 }),
    alertPriceBelow: numeric("alert_price_below", { precision: 20, scale: 4 }),
    notes: text("notes"),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userTickerIdx: uniqueIndex("watchlist_user_ticker_idx").on(t.userId, t.ticker, t.exchange),
  }),
);

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayCurrency: currencyEnum("display_currency").notNull().default("MXN"),
  defaultTimeframe: timeframeEnum("default_timeframe").notNull().default("3M"),
  theme: themeEnum("theme").notNull().default("system"),
  tableDensity: tableDensityEnum("table_density").notNull().default("comfortable"),
  riskProfile: riskProfileEnum("risk_profile").notNull().default("MODERATE"),
  disclaimerAcceptedAt: timestamp("disclaimer_accepted_at", { withTimezone: true }),
});

/**
 * Cache de cotizaciones. TTL lógico: 10 min (lo enforza CachedMarketDataProvider).
 */
export const quoteCache = pgTable(
  "quote_cache",
  {
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    priceUsd: numeric("price_usd", { precision: 20, scale: 4 }),
    priceMxn: numeric("price_mxn", { precision: 20, scale: 4 }).notNull(),
    openMxn: numeric("open_mxn", { precision: 20, scale: 4 }).notNull(),
    highMxn: numeric("high_mxn", { precision: 20, scale: 4 }).notNull(),
    lowMxn: numeric("low_mxn", { precision: 20, scale: 4 }).notNull(),
    volume: bigint("volume", { mode: "number" }).notNull(),
    asOf: timestamp("as_of", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ticker, t.exchange] }),
  }),
);

export const historicalPrice = pgTable(
  "historical_price",
  {
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    date: date("date").notNull(),
    open: doublePrecision("open").notNull(),
    high: doublePrecision("high").notNull(),
    low: doublePrecision("low").notNull(),
    close: doublePrecision("close").notNull(),
    volume: bigint("volume", { mode: "number" }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ticker, t.exchange, t.date] }),
  }),
);

// Tipos inferidos
export type DbUser = typeof users.$inferSelect;
export type DbNewUser = typeof users.$inferInsert;
export type DbHolding = typeof holdings.$inferSelect;
export type DbNewHolding = typeof holdings.$inferInsert;
export type DbTrade = typeof trades.$inferSelect;
export type DbNewTrade = typeof trades.$inferInsert;
export type DbPaperPortfolio = typeof paperPortfolios.$inferSelect;
export type DbPaperPosition = typeof paperPositions.$inferSelect;
export type DbPaperTrade = typeof paperTrades.$inferSelect;
export type DbWatchlistItem = typeof watchlistItems.$inferSelect;
export type DbUserPreferences = typeof userPreferences.$inferSelect;
export type DbQuoteCache = typeof quoteCache.$inferSelect;
export type DbHistoricalPrice = typeof historicalPrice.$inferSelect;
```

Si Drizzle 0.45 cambió alguna API (ej. `pgEnum` syntax), adaptar. Verificar con `pnpm typecheck`.

- [ ] **Step 10.2: Generar migración**

```bash
cd /Users/noel/REPOS/BMV-Stock
./node_modules/.bin/drizzle-kit generate
```

Expected: archivo `drizzle/0001_*.sql` con `CREATE TYPE` para los enums y `CREATE TABLE` para todas las tablas nuevas.

- [ ] **Step 10.3: Inspeccionar la migración**

```bash
cat drizzle/0001_*.sql
```

Verificar que:

- Crea los 8 enums (`exchange`, `trade_action`, etc.).
- Crea las tablas: `holdings`, `trades`, `paper_portfolios`, `paper_positions`, `paper_trades`, `watchlist_items`, `user_preferences`, `quote_cache`, `historical_price`.
- Las foreign keys referencian `users.id`.

**Checkpoint:** Schema completo. Migración generada (sin aplicar — eso requiere DB real, lo hace el usuario después).

---

## Task 11: Drizzle repositories

**Goal:** Implementar cada repository definido en domain/ports/. Cada uno traduce entre la entidad de dominio y la fila de Drizzle.

**Files:**

- Create todos los archivos en `src/infrastructure/db/repositories/`

### Patrón a seguir

Todos los repositories siguen este patrón:

1. Constructor recibe `db: Database` (cliente Drizzle).
2. Método de mapping privado: `toDomain(row): Entity`.
3. Método de mapping al inverso: `toDb(entity): NewDbRow` (cuando aplica).
4. Implementación de cada método del port.
5. Manejo de `null` para `findById` y similares.

- [ ] **Step 11.1: `DrizzleHoldingRepository` (plantilla completa)**

`src/infrastructure/db/repositories/DrizzleHoldingRepository.ts`:

```ts
import { and, eq, isNull } from "drizzle-orm";

import type { Holding } from "@/domain/entities/Holding";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";

import type { Database } from "../client";
import { holdings, type DbHolding } from "../schema";

/**
 * Implementación de `HoldingRepository` usando Drizzle + Neon.
 */
export class DrizzleHoldingRepository implements HoldingRepository {
  constructor(private readonly db: Database) {}

  async listByUser(userId: string, options?: { includeClosed?: boolean }): Promise<Holding[]> {
    const conditions = [eq(holdings.userId, userId)];
    if (!options?.includeClosed) {
      conditions.push(isNull(holdings.closedAt));
    }
    const rows = await this.db
      .select()
      .from(holdings)
      .where(and(...conditions));
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Holding | null> {
    const rows = await this.db.select().from(holdings).where(eq(holdings.id, id)).limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async findByTickerAndExchange(
    userId: string,
    ticker: string,
    exchange: "BMV" | "SIC",
  ): Promise<Holding | null> {
    const rows = await this.db
      .select()
      .from(holdings)
      .where(
        and(
          eq(holdings.userId, userId),
          eq(holdings.ticker, ticker),
          eq(holdings.exchange, exchange),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async create(input: Omit<Holding, "id" | "createdAt" | "updatedAt">): Promise<Holding> {
    const [row] = await this.db
      .insert(holdings)
      .values({
        userId: input.userId,
        ticker: input.ticker,
        exchange: input.exchange,
        quantity: input.quantity.toString(),
        avgCostMxn: input.avgCostMxn.toString(),
        openedAt: input.openedAt,
        closedAt: input.closedAt,
        notes: input.notes,
      })
      .returning();
    if (!row) throw new Error("failed to create holding");
    return this.toDomain(row);
  }

  async update(holding: Holding): Promise<Holding> {
    const [row] = await this.db
      .update(holdings)
      .set({
        quantity: holding.quantity.toString(),
        avgCostMxn: holding.avgCostMxn.toString(),
        closedAt: holding.closedAt,
        notes: holding.notes,
        updatedAt: new Date(),
      })
      .where(eq(holdings.id, holding.id))
      .returning();
    if (!row) throw new Error(`holding not found: ${holding.id}`);
    return this.toDomain(row);
  }

  /**
   * Mapea fila de DB (numerics como strings) a entidad de dominio (numbers).
   */
  private toDomain(row: DbHolding): Holding {
    return {
      id: row.id,
      userId: row.userId,
      ticker: row.ticker,
      exchange: row.exchange,
      quantity: Number(row.quantity),
      avgCostMxn: Number(row.avgCostMxn),
      openedAt: row.openedAt,
      closedAt: row.closedAt,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
```

- [ ] **Step 11.2: Crear los demás repositories siguiendo la misma plantilla**

Implementar los siguientes archivos. Todos siguen el patrón de `DrizzleHoldingRepository` (constructor con `db`, método `toDomain`, mapeo de `numeric` → `Number`):

- `src/infrastructure/db/repositories/DrizzleTradeRepository.ts` — sin método `update` (trades inmutables).
- `src/infrastructure/db/repositories/DrizzlePaperPortfolioRepository.ts` — incluye método `reset(userId)` que en una transacción borra paper_positions, paper_trades del portfolio y resetea cashBalanceMxn al initialBalanceMxn.
- `src/infrastructure/db/repositories/DrizzlePaperPositionRepository.ts` — análogo a holdings pero filtrando por `paperPortfolioId`.
- `src/infrastructure/db/repositories/DrizzlePaperTradeRepository.ts` — análogo a trades.
- `src/infrastructure/db/repositories/DrizzleWatchlistRepository.ts` — incluye `delete(id)` con `db.delete(...).where(eq(...))`.
- `src/infrastructure/db/repositories/DrizzleUserPreferencesRepository.ts` — `upsert` usa `onConflictDoUpdate({ target: userPreferences.userId, set: ... })`.
- `src/infrastructure/db/repositories/DrizzleQuoteCacheRepository.ts` — `find()` regresa null si `now - fetchedAt > 10 min`. `upsert` con `onConflictDoUpdate` por la pkey compuesta. `findHistorical` filtra por rango de fechas. `upsertHistorical` recibe array y lo inserta con `onConflictDoNothing` (si ya existe, asumimos que es el mismo dato histórico).

Para cada uno: importar el port desde `@/domain/ports/...`, importar el schema, escribir TSDoc breve en cada método público explicando casos especiales.

- [ ] **Step 11.3: Validar typecheck y lint**

```bash
pnpm typecheck
pnpm lint
```

Si lint truena por la regla `import/no-restricted-paths` quejándose de algún import, revisar — en infra está permitido importar de domain.

**Checkpoint:** Repositories implementados.

---

## Task 12: `YahooMarketDataProvider`

**Goal:** Implementar el adapter de Yahoo Finance.

**Files:**

- Create: `src/infrastructure/market-data/YahooMarketDataProvider.ts`

- [ ] **Step 12.1: Instalar `yahoo-finance2`**

```bash
cd /Users/noel/REPOS/BMV-Stock
pnpm add yahoo-finance2
```

- [ ] **Step 12.2: Implementar el provider**

`src/infrastructure/market-data/YahooMarketDataProvider.ts`:

```ts
import yahooFinance from "yahoo-finance2";

import type { HistoricalPrice, TimeRange } from "@/domain/entities/HistoricalPrice";
import type { Quote } from "@/domain/entities/Quote";
import { MarketDataUnavailableError, TickerNotFoundError } from "@/domain/errors/DomainError";
import type { MarketDataProvider, MarketSnapshot } from "@/domain/ports/MarketDataProvider";
import type { Ticker } from "@/domain/value-objects/Ticker";

/**
 * Tickers de los benchmarks que se muestran en el dashboard.
 */
const BENCHMARK_TICKERS = {
  ipc: "^MXX", // IPC mexicano
  usdMxn: "MXN=X", // tipo de cambio USD/MXN
  sp500: "^GSPC",
  nasdaq: "^IXIC",
} as const;

/**
 * Mapea TimeRange a número de días desde hoy.
 */
function rangeToDays(range: TimeRange): number {
  switch (range) {
    case "1D":
      return 1;
    case "5D":
      return 5;
    case "1M":
      return 30;
    case "3M":
      return 90;
    case "6M":
      return 180;
    case "1Y":
      return 365;
    case "5Y":
      return 365 * 5;
    case "ALL":
      return 365 * 30; // proxy de "todo"
  }
}

/**
 * Implementación de MarketDataProvider que usa la librería `yahoo-finance2`.
 *
 * Para tickers SIC (sin sufijo `.MX`): pega a Yahoo dos veces — una para el
 * ticker en USD, otra para `MXN=X` (USDMXN spot). Calcula priceMxn = priceUsd
 * * spot. Si solo se necesita BMV, una llamada basta.
 */
export class YahooMarketDataProvider implements MarketDataProvider {
  async getQuote(ticker: Ticker): Promise<Quote> {
    try {
      const yahooQuote = await yahooFinance.quote(ticker.yahooSymbol);
      if (!yahooQuote || !yahooQuote.regularMarketPrice) {
        throw new TickerNotFoundError(ticker.toString());
      }
      const priceNative = yahooQuote.regularMarketPrice;
      let priceUsd: number | null = null;
      let priceMxn: number;
      if (ticker.exchange === "SIC") {
        priceUsd = priceNative;
        const fxQuote = await yahooFinance.quote("MXN=X");
        const usdMxn = fxQuote?.regularMarketPrice;
        if (!usdMxn) {
          throw new MarketDataUnavailableError("yahoo-finance2", "missing USDMXN spot");
        }
        priceMxn = priceNative * usdMxn;
      } else {
        priceMxn = priceNative;
      }
      const open = yahooQuote.regularMarketOpen ?? priceNative;
      const high = yahooQuote.regularMarketDayHigh ?? priceNative;
      const low = yahooQuote.regularMarketDayLow ?? priceNative;
      const volume = Number(yahooQuote.regularMarketVolume ?? 0);
      const fxRate = ticker.exchange === "SIC" ? priceMxn / priceNative : 1;
      return {
        ticker: ticker.symbol,
        exchange: ticker.exchange,
        priceMxn,
        priceUsd,
        openMxn: open * fxRate,
        highMxn: high * fxRate,
        lowMxn: low * fxRate,
        volume,
        asOf: yahooQuote.regularMarketTime ?? new Date(),
      };
    } catch (e) {
      if (e instanceof TickerNotFoundError || e instanceof MarketDataUnavailableError) throw e;
      // yahoo-finance2 throws con messages tipo "Quote not found"; tratamos como not found.
      const msg = e instanceof Error ? e.message : String(e);
      if (/not found|invalid/i.test(msg)) {
        throw new TickerNotFoundError(ticker.toString());
      }
      throw new MarketDataUnavailableError("yahoo-finance2", e);
    }
  }

  async getHistorical(ticker: Ticker, range: TimeRange): Promise<HistoricalPrice[]> {
    try {
      const period2 = new Date();
      const period1 = new Date();
      period1.setDate(period1.getDate() - rangeToDays(range));
      const result = await yahooFinance.chart(ticker.yahooSymbol, {
        period1,
        period2,
        interval: "1d",
      });
      let fxRate = 1;
      if (ticker.exchange === "SIC") {
        const fxQuote = await yahooFinance.quote("MXN=X");
        fxRate = fxQuote?.regularMarketPrice ?? 1;
      }
      return (result.quotes ?? [])
        .filter((q) => q.close !== null && q.close !== undefined)
        .map((q) => ({
          ticker: ticker.symbol,
          exchange: ticker.exchange,
          date: q.date,
          open: (q.open ?? 0) * fxRate,
          high: (q.high ?? 0) * fxRate,
          low: (q.low ?? 0) * fxRate,
          close: (q.close ?? 0) * fxRate,
          volume: q.volume ?? 0,
        }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/not found|invalid/i.test(msg)) {
        throw new TickerNotFoundError(ticker.toString());
      }
      throw new MarketDataUnavailableError("yahoo-finance2", e);
    }
  }

  async getMarketSnapshot(): Promise<MarketSnapshot> {
    try {
      const [ipcQ, usdMxnQ, sp500Q, nasdaqQ] = await Promise.all([
        yahooFinance.quote(BENCHMARK_TICKERS.ipc),
        yahooFinance.quote(BENCHMARK_TICKERS.usdMxn),
        yahooFinance.quote(BENCHMARK_TICKERS.sp500),
        yahooFinance.quote(BENCHMARK_TICKERS.nasdaq),
      ]);
      const usdMxnRate = usdMxnQ?.regularMarketPrice ?? 1;
      const toQuote = (
        q: typeof ipcQ,
        symbol: string,
        exchange: "BMV" | "SIC",
        usdToMxn: number,
      ): Quote => ({
        ticker: symbol,
        exchange,
        priceMxn: (q?.regularMarketPrice ?? 0) * usdToMxn,
        priceUsd: exchange === "SIC" ? (q?.regularMarketPrice ?? 0) : null,
        openMxn: (q?.regularMarketOpen ?? 0) * usdToMxn,
        highMxn: (q?.regularMarketDayHigh ?? 0) * usdToMxn,
        lowMxn: (q?.regularMarketDayLow ?? 0) * usdToMxn,
        volume: Number(q?.regularMarketVolume ?? 0),
        asOf: q?.regularMarketTime ?? new Date(),
      });
      return {
        ipc: toQuote(ipcQ, "IPC", "BMV", 1),
        usdMxn: toQuote(usdMxnQ, "USDMXN", "SIC", 1), // ya está en MXN nativo
        sp500: toQuote(sp500Q, "SPX", "SIC", usdMxnRate),
        nasdaq: toQuote(nasdaqQ, "IXIC", "SIC", usdMxnRate),
      };
    } catch (e) {
      throw new MarketDataUnavailableError("yahoo-finance2", e);
    }
  }
}
```

- [ ] **Step 12.3: Validar typecheck**

```bash
pnpm typecheck
```

Si la API de `yahoo-finance2` cambió, ajustar tipos. La librería suele tener types en `yahoo-finance2/dist/esm/src/modules/...` — consultar si hay errores.

**Checkpoint:** Yahoo provider implementado.

---

## Task 13: `CachedMarketDataProvider` (decorator)

**Goal:** Decorator que envuelve a otro `MarketDataProvider` y cachea los resultados en `quote_cache` y `historical_price` con TTL.

**Files:**

- Create: `src/infrastructure/market-data/CachedMarketDataProvider.ts`

- [ ] **Step 13.1: Implementar el decorator**

`src/infrastructure/market-data/CachedMarketDataProvider.ts`:

```ts
import type { HistoricalPrice, TimeRange } from "@/domain/entities/HistoricalPrice";
import type { Quote } from "@/domain/entities/Quote";
import type { MarketDataProvider, MarketSnapshot } from "@/domain/ports/MarketDataProvider";
import type { QuoteCacheRepository } from "@/domain/ports/QuoteCacheRepository";
import type { Ticker } from "@/domain/value-objects/Ticker";

/**
 * TTL del cache de cotizaciones en milisegundos.
 */
const QUOTE_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Decorator que añade cache en DB sobre cualquier MarketDataProvider.
 * - getQuote: lee de quote_cache si está fresco; si no, pega al delegate y persiste.
 * - getHistorical: lee de historical_price; si faltan días en el rango, pega al
 *   delegate y persiste lo que vino.
 * - getMarketSnapshot: no se cachea (es agregado y se renueva pegando al delegate).
 */
export class CachedMarketDataProvider implements MarketDataProvider {
  constructor(
    private readonly delegate: MarketDataProvider,
    private readonly cache: QuoteCacheRepository,
  ) {}

  async getQuote(ticker: Ticker): Promise<Quote> {
    const cached = await this.cache.find(ticker.symbol, ticker.exchange);
    if (cached && Date.now() - cached.asOf.getTime() < QUOTE_CACHE_TTL_MS) {
      return cached;
    }
    const fresh = await this.delegate.getQuote(ticker);
    await this.cache.upsert(fresh);
    return fresh;
  }

  async getHistorical(ticker: Ticker, range: TimeRange): Promise<HistoricalPrice[]> {
    // Estrategia simple v1: si tenemos al menos un dato del rango en cache, usarlo;
    // si está vacío, pegar al delegate y persistir todo.
    // Una v2 puede hacer "fill gaps" — pero el flujo más común es ver una emisora
    // por primera vez (cache vacía) o re-ver la misma (cache poblada).
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - rangeDays(range));
    const cached = await this.cache.findHistorical(
      ticker.symbol,
      ticker.exchange,
      fromDate,
      new Date(),
    );
    if (cached.length >= rangeDays(range) * 0.6) {
      // Heurística: si tenemos al menos 60% de los días esperados, servir cache.
      return cached;
    }
    const fresh = await this.delegate.getHistorical(ticker, range);
    if (fresh.length > 0) {
      await this.cache.upsertHistorical(fresh);
    }
    return fresh;
  }

  async getMarketSnapshot(): Promise<MarketSnapshot> {
    return this.delegate.getMarketSnapshot();
  }
}

function rangeDays(range: TimeRange): number {
  switch (range) {
    case "1D":
      return 1;
    case "5D":
      return 5;
    case "1M":
      return 30;
    case "3M":
      return 90;
    case "6M":
      return 180;
    case "1Y":
      return 365;
    case "5Y":
      return 365 * 5;
    case "ALL":
      return 365 * 30;
  }
}
```

- [ ] **Step 13.2: Validar typecheck**

```bash
pnpm typecheck
```

**Checkpoint:** Cache decorator listo.

---

## Task 14: Use cases (TDD)

**Goal:** Implementar `getQuote`, `getMarketSnapshot`, `getHistoricalPrices` como funciones puras que reciben sus dependencias por argumento (inyección manual). Tests con mocks de los ports.

**Files:**

- Create: `src/application/quotes/getQuote.ts` + `.test.ts`
- Create: `src/application/quotes/getMarketSnapshot.ts` + `.test.ts`
- Create: `src/application/quotes/getHistoricalPrices.ts` + `.test.ts`

- [ ] **Step 14.1: Test fallido para `getQuote`**

`src/application/quotes/getQuote.test.ts`:

```ts
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
```

- [ ] **Step 14.2: Implementar `getQuote`**

`src/application/quotes/getQuote.ts`:

```ts
import type { Quote } from "@/domain/entities/Quote";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import { Ticker } from "@/domain/value-objects/Ticker";

export interface GetQuoteInput {
  provider: MarketDataProvider;
  rawTicker: string;
}

/**
 * Obtiene la cotización actual de una emisora.
 * - Valida y normaliza el ticker vía `Ticker.parse`.
 * - Delega al provider (que puede ser cached, yahoo, etc.).
 * - Errores de dominio (`InvalidTickerError`, `TickerNotFoundError`,
 *   `MarketDataUnavailableError`) se propagan tal cual.
 */
export async function getQuote({ provider, rawTicker }: GetQuoteInput): Promise<Quote> {
  const ticker = Ticker.parse(rawTicker);
  return provider.getQuote(ticker);
}
```

- [ ] **Step 14.3: Correr tests, deben pasar**

```bash
pnpm test src/application/quotes/getQuote
```

- [ ] **Step 14.4: Implementar `getMarketSnapshot` y test**

`src/application/quotes/getMarketSnapshot.ts`:

```ts
import type { MarketDataProvider, MarketSnapshot } from "@/domain/ports/MarketDataProvider";

export interface GetMarketSnapshotInput {
  provider: MarketDataProvider;
}

/**
 * Snapshot agregado de los benchmarks (IPC, USDMXN, S&P 500, NASDAQ)
 * que el dashboard muestra en su parte superior.
 */
export async function getMarketSnapshot({
  provider,
}: GetMarketSnapshotInput): Promise<MarketSnapshot> {
  return provider.getMarketSnapshot();
}
```

`src/application/quotes/getMarketSnapshot.test.ts`:

```ts
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
```

- [ ] **Step 14.5: Implementar `getHistoricalPrices` y test**

`src/application/quotes/getHistoricalPrices.ts`:

```ts
import type { HistoricalPrice, TimeRange } from "@/domain/entities/HistoricalPrice";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import { Ticker } from "@/domain/value-objects/Ticker";

export interface GetHistoricalPricesInput {
  provider: MarketDataProvider;
  rawTicker: string;
  range: TimeRange;
}

/**
 * Obtiene la serie histórica OHLCV de una emisora para un rango temporal.
 * Valida y normaliza el ticker antes de delegar.
 */
export async function getHistoricalPrices({
  provider,
  rawTicker,
  range,
}: GetHistoricalPricesInput): Promise<HistoricalPrice[]> {
  const ticker = Ticker.parse(rawTicker);
  return provider.getHistorical(ticker, range);
}
```

`src/application/quotes/getHistoricalPrices.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import type { HistoricalPrice } from "@/domain/entities/HistoricalPrice";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";

import { getHistoricalPrices } from "./getHistoricalPrices";

describe("getHistoricalPrices", () => {
  it("delega al provider con el ticker parseado y rango", async () => {
    const fixture: HistoricalPrice[] = [
      {
        ticker: "WALMEX",
        exchange: "BMV",
        date: new Date("2026-01-15"),
        open: 68,
        high: 70,
        low: 67,
        close: 69.42,
        volume: 1_000_000,
      },
    ];
    const provider: MarketDataProvider = {
      getQuote: vi.fn(),
      getHistorical: vi.fn().mockResolvedValue(fixture),
      getMarketSnapshot: vi.fn(),
    };
    const result = await getHistoricalPrices({
      provider,
      rawTicker: "walmex.mx",
      range: "3M",
    });
    expect(result).toBe(fixture);
    expect(provider.getHistorical).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: "WALMEX", exchange: "BMV" }),
      "3M",
    );
  });
});
```

- [ ] **Step 14.6: Correr todos los tests del módulo**

```bash
pnpm test src/application/quotes
```

Expected: 6 tests passed.

**Checkpoint:** Use cases listos.

---

## Task 15: Composition root (`di.ts`)

**Goal:** Centralizar la instantiación de la cadena de dependencias para que los API routes solo llamen a una función.

**Files:**

- Create: `src/application/di.ts`

- [ ] **Step 15.1: Implementar la composition root**

`src/application/di.ts`:

```ts
import { db } from "@/infrastructure/db/client";
import { DrizzleHoldingRepository } from "@/infrastructure/db/repositories/DrizzleHoldingRepository";
import { DrizzlePaperPortfolioRepository } from "@/infrastructure/db/repositories/DrizzlePaperPortfolioRepository";
import { DrizzlePaperPositionRepository } from "@/infrastructure/db/repositories/DrizzlePaperPositionRepository";
import { DrizzlePaperTradeRepository } from "@/infrastructure/db/repositories/DrizzlePaperTradeRepository";
import { DrizzleQuoteCacheRepository } from "@/infrastructure/db/repositories/DrizzleQuoteCacheRepository";
import { DrizzleTradeRepository } from "@/infrastructure/db/repositories/DrizzleTradeRepository";
import { DrizzleUserPreferencesRepository } from "@/infrastructure/db/repositories/DrizzleUserPreferencesRepository";
import { DrizzleWatchlistRepository } from "@/infrastructure/db/repositories/DrizzleWatchlistRepository";
import { CachedMarketDataProvider } from "@/infrastructure/market-data/CachedMarketDataProvider";
import { YahooMarketDataProvider } from "@/infrastructure/market-data/YahooMarketDataProvider";

/**
 * Composition root.
 * Las API routes y server components llaman a `getDeps()` para obtener
 * la cadena de dependencias ya armada. Single instance por proceso (singleton).
 */
let cachedDeps: ReturnType<typeof buildDeps> | null = null;

function buildDeps() {
  const quoteCache = new DrizzleQuoteCacheRepository(db);
  const yahoo = new YahooMarketDataProvider();
  const marketData = new CachedMarketDataProvider(yahoo, quoteCache);
  return {
    marketData,
    holdings: new DrizzleHoldingRepository(db),
    trades: new DrizzleTradeRepository(db),
    paperPortfolio: new DrizzlePaperPortfolioRepository(db),
    paperPosition: new DrizzlePaperPositionRepository(db),
    paperTrade: new DrizzlePaperTradeRepository(db),
    watchlist: new DrizzleWatchlistRepository(db),
    userPreferences: new DrizzleUserPreferencesRepository(db),
  };
}

export function getDeps() {
  cachedDeps ??= buildDeps();
  return cachedDeps;
}
```

**Importante:** Esta es la EXCEPCIÓN a la regla de capas — `application/di.ts` es la composition root y SÍ importa de `infrastructure/`. Para que ESLint no se queje, la regla `import/no-restricted-paths` permite `./src/application` → `./src/domain` solamente, lo cual rompería con `di.ts`. Solución: agregar `di.ts` a las excepciones de la regla.

- [ ] **Step 15.2: Actualizar la regla de ESLint**

Editar `eslint.config.mjs`. En la zona `target: "./src/application"` → `from: "./src/infrastructure"`, agregar `except: ["./src/application/di.ts"]`:

```js
{
  target: "./src/application",
  from: "./src/infrastructure",
  except: ["./src/application/di.ts"],
  message: "application layer must depend only on domain, except di.ts which is the composition root",
},
```

- [ ] **Step 15.3: Validar typecheck + lint**

```bash
pnpm typecheck
pnpm lint
```

**Checkpoint:** Composition root listo.

---

## Task 16: Endpoint `/api/quotes`

**Goal:** Crear el endpoint que la UI consumirá para obtener cotizaciones.

**Files:**

- Create: `src/lib/schemas/quote.ts`
- Create: `src/app/api/quotes/route.ts`

- [ ] **Step 16.1: Schema Zod compartido**

`src/lib/schemas/quote.ts`:

```ts
import { z } from "zod";

/**
 * Schema de query string para GET /api/quotes.
 */
export const quoteQuerySchema = z.object({
  ticker: z.string().min(1).max(20),
});

export type QuoteQuery = z.infer<typeof quoteQuerySchema>;
```

- [ ] **Step 16.2: Route handler**

`src/app/api/quotes/route.ts`:

```ts
import { NextResponse } from "next/server";

import { getQuote } from "@/application/quotes/getQuote";
import { getDeps } from "@/application/di";
import { DomainError } from "@/domain/errors/DomainError";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { quoteQuerySchema } from "@/lib/schemas/quote";

/**
 * GET /api/quotes?ticker=WALMEX.MX
 *
 * Regresa la cotización actual del ticker. Requiere sesión.
 */
export async function GET(req: Request) {
  try {
    await requireUserId();
    const url = new URL(req.url);
    const parsed = quoteQuerySchema.safeParse({ ticker: url.searchParams.get("ticker") });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid query", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { marketData } = getDeps();
    const quote = await getQuote({ provider: marketData, rawTicker: parsed.data.ticker });
    return NextResponse.json(quote);
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof DomainError) {
      const status =
        e.code === "TICKER_NOT_FOUND"
          ? 404
          : e.code === "INVALID_TICKER"
            ? 400
            : e.code === "MARKET_DATA_UNAVAILABLE"
              ? 503
              : 500;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("/api/quotes error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
```

**Importante:** este archivo importa `getDeps` de `application/di.ts` y `requireUserId` de `infrastructure/auth/clerk.ts`. La excepción de la regla de ESLint para `auth/clerk.ts` y `db/client.ts` ya cubre este caso.

- [ ] **Step 16.3: Validar build completo**

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Expected: build pasa. La nueva ruta `/api/quotes` aparece en el output.

**Checkpoint:** Endpoint operativo.

---

## Task 17: Validación de cobertura

**Goal:** Confirmar que `domain/` y `application/` cumplen con el threshold de 90% lines / 85% branches definido en `vitest.config.ts`.

- [ ] **Step 17.1: Correr tests con coverage**

```bash
cd /Users/noel/REPOS/BMV-Stock
pnpm test --coverage
```

Expected: el reporte muestra ≥90% lines, ≥85% branches en `src/domain/**` y `src/application/**`. Si Vitest aborta con "thresholds not met", agregar tests para los caminos faltantes.

- [ ] **Step 17.2: Si falta cobertura, agregar tests**

Identificar qué archivos están bajo el threshold. Casos típicos olvidados:

- `Money.equals` con monedas distintas.
- `Holding` con notes != null.
- `Percentage.toString` con valor 0.

Agregar tests minimalistas que ejerciten esos paths.

**Checkpoint:** Cobertura ≥90%.

---

## Task 18: Validación final

- [ ] **Step 18.1: Pipeline completa**

```bash
cd /Users/noel/REPOS/BMV-Stock
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Las cinco deben pasar.

- [ ] **Step 18.2: Aplicar la migración 0001 (solo si las API keys ya están en `.env.local`)**

Si el usuario ya pegó las credenciales reales de Neon:

```bash
pnpm db:migrate
```

Verificar en Neon dashboard o `pnpm db:studio` que existen todas las tablas:

- users (ya existía)
- holdings, trades
- paper_portfolios, paper_positions, paper_trades
- watchlist_items
- user_preferences
- quote_cache, historical_price

Si las API keys siguen siendo placeholder, dejar este paso para cuando estén las reales.

- [ ] **Step 18.3: Smoke test del endpoint (solo si DB y Clerk están reales)**

```bash
pnpm dev
```

En otra terminal:

```bash
# Login en navegador a http://localhost:3000 primero (Clerk session cookie).
# Luego:
curl -i 'http://localhost:3000/api/quotes?ticker=WALMEX.MX' \
  -H "Cookie: __session=<paste tu Clerk session cookie>"
```

Expected: 200 con JSON `{ ticker: "WALMEX", exchange: "BMV", priceMxn: ..., ... }`.

Si recibes 401, la cookie está mal. Si recibes 503 con `MARKET_DATA_UNAVAILABLE`, Yahoo está caído (esperado ocasionalmente).

**Checkpoint final:** Plan 2 completo. La capa de dominio está cerrada, los use cases andan, el endpoint de quotes está vivo.

---

## Lo que sigue (Plan 3)

**Plan 3: Portafolio Real + Paper Trading** cubrirá:

- Use cases: `recordRealTrade`, `getHoldings`, `computePortfolioMetrics`, `getSectorAllocation`, `executePaperTrade`, `getPaperPortfolio`, `resetPaperPortfolio`.
- Endpoints: `/api/portfolio`, `/api/portfolio/trades`, `/api/paper-trading`, `/api/paper-trading/trades`.
- Páginas: `/portfolio` (lista de holdings + comparativa vs IPC), `/portfolio/trade` (form de registro), `/paper-trading` (portafolio simulado), `/paper-trading/trade` (form), `/paper-trading/history`.
- Componentes financieros: `MetricCard`, `MoneyDisplay`, `TickerBadge`, `PnLBadge`, `ExchangeBadge`.
- `PortfolioTable` (container + view) y `TradeForm` con `react-hook-form` + Zod.

Cuando Plan 2 esté ejecutado y verificado, escribir Plan 3.
