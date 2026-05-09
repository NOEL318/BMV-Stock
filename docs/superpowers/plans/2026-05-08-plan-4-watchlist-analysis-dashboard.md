# BMV Stock · Plan 4 · Watchlist + Análisis + Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development o superpowers:executing-plans. Steps con checkbox (`- [ ]`).

> **Preferencias del usuario:** Sin `git commit` automático. Sin emojis. TSDoc en cada export. Comentarios en español con acentos. Identificadores en inglés. Strict TS.

> **Pre-condición:** Plans 1-3 ejecutados. Domain + Yahoo + use cases de portfolio + paper trading + componentes finance + páginas operativas. 119 tests passing.

**Goal:** Construir las 3 pantallas restantes que entregan valor pedagógico: watchlist (seguir emisoras), análisis individual de ticker con gráficas e indicadores técnicos explicados, y dashboard real con snapshot del mercado + mini-portfolio + últimos trades.

**Architecture:** Mismo patrón. Use cases con TDD que reciben dependencias por argumento. API routes thin. Componentes con folder propio. Conceptos educativos en `lib/concepts/`.

**Tech Stack adicional:** `lightweight-charts` (TradingView) para PriceChart. Cálculos de indicadores en `application/analysis/computeIndicators.ts` (puro TS, sin librerías).

**Spec referencia:** `docs/superpowers/specs/2026-05-06-bmv-stock-design.md` (sección 9 componentes, sección 17 conceptos educativos).

---

## File structure que se creará

```
src/
├── application/
│   ├── analysis/
│   │   ├── computeIndicators.ts (+ .test.ts)         ← RSI, SMA, EMA, MACD
│   │   └── getFundamentals.ts (+ .test.ts)
│   ├── watchlist/
│   │   ├── addToWatchlist.ts (+ .test.ts)
│   │   ├── removeFromWatchlist.ts (+ .test.ts)
│   │   └── getWatchlistWithQuotes.ts (+ .test.ts)
│   └── dashboard/
│       └── getDashboardData.ts (+ .test.ts)
├── lib/
│   └── concepts/
│       ├── index.ts                                    ← export const CONCEPTS
│       └── definitions.ts                              ← RSI, P/E, etc.
├── components/
│   ├── charts/
│   │   ├── PriceChart/...                              ← Lightweight Charts wrapper
│   │   └── SparkLine/...                               ← mini línea SVG
│   ├── education/
│   │   ├── MetricTooltip/...
│   │   └── ConceptCard/...
│   └── tables/
│       └── WatchlistTable/...                           ← container + view
├── hooks/
│   ├── useWatchlist.ts
│   ├── useAnalysis.ts
│   └── useDashboard.ts
└── app/
    ├── api/
    │   ├── watchlist/
    │   │   ├── route.ts                                 ← GET + POST
    │   │   └── [id]/route.ts                            ← DELETE
    │   ├── analysis/
    │   │   └── [ticker]/route.ts                        ← GET quote + indicators
    │   └── dashboard/route.ts                           ← GET snapshot + summaries
    └── (app)/
        ├── watchlist/page.tsx                           ← reemplaza placeholder
        ├── analysis/
        │   ├── page.tsx                                 ← search/landing
        │   └── [ticker]/page.tsx                        ← análisis detallado
        └── dashboard/page.tsx                           ← reemplaza placeholder
```

---

## Task 1: Indicadores técnicos (TDD puro TS)

**Goal:** Funciones puras que calculan SMA, EMA, RSI, MACD desde un array de precios. Cero dependencias.

**Files:**

- Create: `src/application/analysis/computeIndicators.ts` + `.test.ts`

- [ ] **Step 1.1: Tests fallidos**

`src/application/analysis/computeIndicators.test.ts`:

```ts
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
```

- [ ] **Step 1.2: Implementar**

`src/application/analysis/computeIndicators.ts`:

```ts
/**
 * Calcula la media móvil simple (SMA) de una serie de precios.
 * Los primeros `period - 1` valores son null (no hay suficientes datos).
 *
 * @param prices - serie temporal de precios
 * @param period - ventana del SMA (típicamente 20, 50, 200)
 * @returns array de la misma longitud, con null en las primeras posiciones
 */
export function computeSMA(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(prices.length).fill(null);
  if (period <= 0 || prices.length === 0) return result;
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j]!;
    }
    result[i] = sum / period;
  }
  return result;
}

/**
 * Calcula la media móvil exponencial (EMA) de una serie de precios.
 * Más sensible a precios recientes que SMA.
 *
 * Implementación estándar: el primer valor del EMA es el SMA del período
 * inicial; los siguientes usan la fórmula recursiva
 * `EMA[i] = alpha * price[i] + (1 - alpha) * EMA[i-1]` donde `alpha = 2 / (period + 1)`.
 */
export function computeEMA(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(prices.length).fill(null);
  if (period <= 0 || prices.length === 0) return result;
  const alpha = 2 / (period + 1);
  // Seed: SMA del primer período
  if (prices.length < period) return result;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i]!;
  result[period - 1] = sum / period;
  for (let i = period; i < prices.length; i++) {
    const prev = result[i - 1]!;
    result[i] = alpha * prices[i]! + (1 - alpha) * prev;
  }
  return result;
}

/**
 * Calcula el Relative Strength Index (RSI) con la fórmula original de
 * Wilder (1978). RSI mayor a 70 es sobrecomprado, menor a 30 es sobrevendido.
 *
 * @param period - típicamente 14
 */
export function computeRSI(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(prices.length).fill(null);
  if (prices.length <= period) return result;

  // Calcular cambios y separar gains de losses
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i]! - prices[i - 1]!;
    if (change >= 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  // Smoothed averages para los siguientes períodos
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i]! - prices[i - 1]!;
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

/**
 * Resultado del MACD: la línea MACD, la línea de señal y el histograma.
 */
export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

/**
 * Calcula MACD con los parámetros estándar (12, 26, 9):
 * - MACD line = EMA(12) - EMA(26)
 * - Signal = EMA(9) sobre la MACD line
 * - Histogram = MACD - Signal
 */
export function computeMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDResult {
  const fast = computeEMA(prices, fastPeriod);
  const slow = computeEMA(prices, slowPeriod);
  const macd: (number | null)[] = prices.map((_, i) => {
    const f = fast[i];
    const s = slow[i];
    return f !== null && s !== null ? f - s : null;
  });
  // Para signal necesitamos EMA del MACD, pero EMA no acepta nulls — saltamos
  // los nulls iniciales y aplicamos EMA al resto.
  const macdNonNullStart = macd.findIndex((v) => v !== null);
  const signal: (number | null)[] = new Array(prices.length).fill(null);
  if (macdNonNullStart !== -1) {
    const macdValues = macd.slice(macdNonNullStart) as number[];
    const signalValues = computeEMA(macdValues, signalPeriod);
    for (let i = 0; i < signalValues.length; i++) {
      signal[macdNonNullStart + i] = signalValues[i] ?? null;
    }
  }
  const histogram = macd.map((m, i) => {
    const s = signal[i];
    return m !== null && s !== null ? m - s : null;
  });
  return { macd, signal, histogram };
}
```

- [ ] **Step 1.3: Tests pasan**

```bash
pnpm test src/application/analysis/computeIndicators
```

**Checkpoint Task 1.**

---

## Task 2: Conceptos educativos en `lib/concepts`

**Goal:** Catálogo estático de conceptos financieros (RSI, P/E, MACD, etc.) con explicación corta para tooltips y larga para drawer.

**Files:**

- Create: `src/lib/concepts/definitions.ts` y `index.ts`

- [ ] **Step 2.1: Definir el catálogo**

`src/lib/concepts/definitions.ts`:

```ts
/**
 * Definición de un concepto financiero/técnico, usada en tooltips y drawers
 * educativos.
 */
export interface ConceptDefinition {
  slug: string;
  title: string;
  /** Para tooltip — 1 a 2 oraciones. */
  shortExplanation: string;
  /** Para drawer detallado — markdown permitido. */
  longExplanation: string;
}

/**
 * Catálogo principal de conceptos. Indexado por slug.
 */
export const CONCEPTS: Record<string, ConceptDefinition> = {
  "pe-ratio": {
    slug: "pe-ratio",
    title: "P/E (Price to Earnings)",
    shortExplanation:
      "Cuántos pesos pagas por cada peso de utilidad anual. P/E bajo = barato relativo a utilidades; alto = expectativa de crecimiento.",
    longExplanation:
      "El P/E divide el precio de la acción entre la utilidad por acción del último año. Es el múltiplo más usado para valuar acciones. Un P/E de 15 significa que pagas 15 pesos por cada peso de utilidad. Comparar contra el P/E del sector y el promedio histórico de la propia emisora.",
  },
  rsi: {
    slug: "rsi",
    title: "RSI (Relative Strength Index)",
    shortExplanation:
      "Indicador técnico de momentum. Mayor a 70 es sobrecomprado (posible corrección); menor a 30 es sobrevendido (posible rebote).",
    longExplanation:
      "Wilder (1978). Calcula la fuerza relativa de las ganancias vs pérdidas en un período (típicamente 14 días). Va de 0 a 100. No es señal por sí solo — usar en combinación con tendencia y volumen.",
  },
  macd: {
    slug: "macd",
    title: "MACD (Moving Average Convergence Divergence)",
    shortExplanation:
      "Diferencia entre EMA de 12 y 26 períodos, con una línea de señal de 9 períodos. Cruces alcistas/bajistas indican cambios de tendencia.",
    longExplanation:
      "Tres componentes: línea MACD (EMA12 - EMA26), línea de señal (EMA9 del MACD), e histograma (MACD - señal). Cuando la MACD cruza arriba de la señal es bullish; cuando cruza abajo es bearish. El histograma anticipa los cruces.",
  },
  sma: {
    slug: "sma",
    title: "SMA (Simple Moving Average)",
    shortExplanation:
      "Promedio simple de los precios de los últimos N días. SMA20 (corto plazo), SMA50 (medio), SMA200 (tendencia de fondo).",
    longExplanation:
      "Ayuda a suavizar el ruido del precio diario y ver la tendencia. El precio cruzando arriba de la SMA200 suele marcar el inicio de un mercado alcista; cruzando abajo, un bajista.",
  },
  ema: {
    slug: "ema",
    title: "EMA (Exponential Moving Average)",
    shortExplanation:
      "Como SMA pero pondera más a precios recientes. Reacciona más rápido a cambios.",
    longExplanation:
      "Usa la fórmula `EMA = alpha * precio + (1-alpha) * EMA_anterior`, donde alpha depende del período. Más sensible que SMA pero también más ruidosa.",
  },
  "dividend-yield": {
    slug: "dividend-yield",
    title: "Rendimiento por dividendo",
    shortExplanation:
      "Dividendo anual dividido entre precio. Si paga $5 al año y la acción cuesta $100, el yield es 5%.",
    longExplanation:
      "Ojo: yield alto puede ser señal de problema (precio bajó porque la empresa va mal). Comparar contra el promedio del sector y revisar el payout ratio.",
  },
  "market-cap": {
    slug: "market-cap",
    title: "Capitalización de mercado",
    shortExplanation:
      "Precio multiplicado por acciones en circulación. Tamaño total de la empresa según el mercado.",
    longExplanation:
      "Categorías comunes: small cap (menor a 2B USD), mid cap (2-10B), large cap (más de 10B). En México, las emisoras del IPC son large cap mexicanas pero small/mid cap globales.",
  },
  "core-satellite": {
    slug: "core-satellite",
    title: "Núcleo / Satélite",
    shortExplanation:
      "Estrategia: la mayor parte del portafolio en ETFs amplios (núcleo, aburrido), una porción menor en apuestas activas (satélite).",
    longExplanation:
      "Estadísticamente, retail activo pierde contra el índice. Tener 70 a 90 por ciento del capital en ETFs diversificados protege el grueso, mientras una porción menor permite aprender y participar en oportunidades específicas.",
  },
  etf: {
    slug: "etf",
    title: "ETF (Exchange-Traded Fund)",
    shortExplanation:
      "Fondo que cotiza como acción. Compras una unidad y obtienes exposición a docenas o cientos de emisoras subyacentes.",
    longExplanation:
      "En México: NAFTRAC replica el IPC. Vía SIC tienes acceso a ETFs internacionales (SPY = S&P 500, QQQ = NASDAQ-100, VOO, VTI, etc.). Comisiones (TER) muy bajas (típicamente menor a 0.1 por ciento anual).",
  },
  naftrac: {
    slug: "naftrac",
    title: "NAFTRAC",
    shortExplanation:
      "ETF que replica el IPC (Índice de Precios y Cotizaciones de la BMV). Es el equivalente mexicano del SPY estadounidense.",
    longExplanation:
      "Diversificación instantánea sobre las 35+ emisoras del IPC. Comisión anual baja. Es la base recomendada para la parte mexicana del núcleo de un portafolio.",
  },
  beta: {
    slug: "beta",
    title: "Beta",
    shortExplanation:
      "Mide qué tanto se mueve una acción cuando el mercado se mueve. Beta de 1 = igual que el mercado; mayor a 1 = más volátil; menor a 1 = más estable.",
    longExplanation:
      "Calculado contra un benchmark (típicamente el IPC para emisoras mexicanas, S&P 500 para internacionales). Útil para entender el riesgo sistemático que aporta una posición al portafolio.",
  },
  volatility: {
    slug: "volatility",
    title: "Volatilidad",
    shortExplanation:
      "Qué tan variable es el precio. Mayor volatilidad = movimientos más grandes en ambas direcciones = más riesgo.",
    longExplanation:
      "Suele medirse como desviación estándar anualizada de los retornos diarios. Volatilidades típicas: ETFs amplios 15 a 20 por ciento, acciones individuales 25 a 50 por ciento, cripto 60+ por ciento.",
  },
  "dollar-cost-averaging": {
    slug: "dollar-cost-averaging",
    title: "Dollar-Cost Averaging (DCA)",
    shortExplanation:
      "Comprar el mismo monto cada periodo (semanal, mensual). Promedia tu costo y reduce el riesgo de timing.",
    longExplanation:
      "Compras más unidades cuando el precio está bajo y menos cuando está alto. Estadísticamente supera a intentar adivinar el mejor momento de entrada.",
  },
  "support-resistance": {
    slug: "support-resistance",
    title: "Soporte y resistencia",
    shortExplanation:
      "Niveles donde el precio históricamente rebota (soporte) o se frena (resistencia). Son zonas, no puntos exactos.",
    longExplanation:
      "Soportes y resistencias ganan validez con el número de veces que el precio los respeta. Cuando se rompen, suelen invertir su rol (un soporte roto se vuelve resistencia).",
  },
  volume: {
    slug: "volume",
    title: "Volumen",
    shortExplanation:
      "Cantidad de acciones intercambiadas en un período. Movimientos con alto volumen son más confiables.",
    longExplanation:
      "Un movimiento con bajo volumen suele ser ruido. Un breakout con volumen alto es más probable que se sostenga.",
  },
  "sic-mexico": {
    slug: "sic-mexico",
    title: "SIC (Sistema Internacional de Cotizaciones)",
    shortExplanation:
      "Mercado de la BMV donde puedes comprar acciones extranjeras (AAPL, SPY, etc.) liquidando en pesos.",
    longExplanation:
      "Permite a inversionistas mexicanos diversificar fuera de México sin abrir cuenta en el extranjero. El precio se cotiza convertido a MXN al spot del día. GBM+ ofrece acceso al SIC.",
  },
};
```

- [ ] **Step 2.2: Index**

`src/lib/concepts/index.ts`:

```ts
export { CONCEPTS } from "./definitions";
export type { ConceptDefinition } from "./definitions";

/**
 * Helper para obtener un concepto por slug. Lanza si no existe (catalogue
 * cerrado en código, debería ser detectable en tests/typecheck).
 */
export function getConcept(slug: string): import("./definitions").ConceptDefinition {
  const concept = (await import("./definitions")).CONCEPTS[slug];
  if (!concept) throw new Error(`unknown concept: ${slug}`);
  return concept;
}
```

Nota: el `getConcept` con `await import` es problemático en uso síncrono — preferible importar el catálogo directo y leerlo. Implementar como acceso directo:

```ts
import { CONCEPTS, type ConceptDefinition } from "./definitions";

export { CONCEPTS };
export type { ConceptDefinition };

/**
 * Lookup síncrono por slug. Regresa undefined si no existe (caller decide).
 */
export function findConcept(slug: string): ConceptDefinition | undefined {
  return CONCEPTS[slug];
}
```

**Checkpoint Task 2.**

---

## Task 3: Componente `MetricTooltip` y `ConceptCard`

**Files:**

- Create: `src/components/education/MetricTooltip/...`
- Create: `src/components/education/ConceptCard/...`

### MetricTooltip

Pequeño icono `?` con popover que muestra el `shortExplanation` del concepto y un botón "Aprender más" que abre un drawer con `longExplanation`.

```ts
// types
export interface MetricTooltipProps {
  /** Slug del concepto en el catálogo CONCEPTS. */
  concept: string;
  size?: "sm" | "md";
  className?: string;
}
```

Render: usa `<Tooltip>` o `<Popover>` de shadcn (si no está, instalar con `pnpm dlx shadcn@latest add tooltip popover`). Renderiza un icono `LuCircleHelp` que al hover/click muestra el shortExplanation. Si el concepto no existe, render null.

### ConceptCard

Card que muestra título + longExplanation completa. Usado en el "drawer" de cada concepto o en la página `/aprende` futura.

```ts
export interface ConceptCardProps {
  concept: string;
  className?: string;
}
```

Render: `<Card>` con título + `<div className="prose prose-sm">` para el longExplanation.

Tests para cada componente: 2-3 (renderiza tooltip, no renderiza si concept inexistente).

**Checkpoint Task 3.**

---

## Task 4: Componente `PriceChart`

**Goal:** Wrapper de Lightweight Charts (TradingView) para mostrar gráfica de velas o línea con indicadores opcionales.

**Files:**

- Create: `src/components/charts/PriceChart/PriceChart.{tsx,types,styles,test}`

- [ ] **Step 4.1: Instalar lightweight-charts**

```bash
pnpm add lightweight-charts
```

- [ ] **Step 4.2: types**

```ts
import type { HistoricalPrice, TimeRange } from "@/domain/entities/HistoricalPrice";

export type PriceChartType = "candles" | "line" | "area";

export type PriceChartIndicator = "sma20" | "sma50" | "sma200" | "ema12" | "ema26";

export interface PriceChartProps {
  data: HistoricalPrice[];
  type?: PriceChartType;
  /** Lista de overlays a dibujar sobre la gráfica. */
  indicators?: PriceChartIndicator[];
  showVolume?: boolean;
  height?: number;
  /** "auto" sigue el theme del documento (clase .dark en html). */
  theme?: "light" | "dark" | "auto";
  className?: string;
}
```

- [ ] **Step 4.3: render**

```tsx
"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

import { computeSMA } from "@/application/analysis/computeIndicators";
import { cn } from "@/lib/utils";

import type { PriceChartProps } from "./PriceChart.types";

/**
 * Wrapper minimalista de Lightweight Charts (TradingView).
 *
 * Renderiza una gráfica de velas/línea y dibuja indicadores como overlays.
 * El theme se resuelve al montar y se actualiza si cambia la clase `.dark`.
 */
export function PriceChart({
  data,
  type = "candles",
  indicators = [],
  showVolume = false,
  height = 400,
  theme = "auto",
  className,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const isDark =
      theme === "dark" || (theme === "auto" && document.documentElement.classList.contains("dark"));
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDark ? "#a1a1aa" : "#71717a",
      },
      grid: {
        vertLines: { color: isDark ? "#27272a" : "#e4e4e7" },
        horzLines: { color: isDark ? "#27272a" : "#e4e4e7" },
      },
      timeScale: { borderColor: isDark ? "#27272a" : "#e4e4e7" },
      rightPriceScale: { borderColor: isDark ? "#27272a" : "#e4e4e7" },
    });
    chartRef.current = chart;

    const points = data.map((d) => ({
      time: d.date.toISOString().slice(0, 10) as never,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      value: d.close,
      volume: d.volume,
    }));

    if (type === "candles") {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#16A34A",
        downColor: "#DC2626",
        borderVisible: false,
        wickUpColor: "#16A34A",
        wickDownColor: "#DC2626",
      });
      series.setData(points);
    } else {
      const series = chart.addSeries(LineSeries, {
        color: isDark ? "#60A5FA" : "#1E3A8A",
        lineWidth: 2,
      });
      series.setData(points.map((p) => ({ time: p.time, value: p.value })));
    }

    // Indicators
    const closes = data.map((d) => d.close);
    for (const ind of indicators) {
      const config: Record<string, { period: number; color: string }> = {
        sma20: { period: 20, color: "#3B82F6" },
        sma50: { period: 50, color: "#F59E0B" },
        sma200: { period: 200, color: "#8B5CF6" },
        ema12: { period: 12, color: "#22D3EE" },
        ema26: { period: 26, color: "#F472B6" },
      };
      const c = config[ind];
      if (!c) continue;
      const values = computeSMA(closes, c.period);
      const series = chart.addSeries(LineSeries, { color: c.color, lineWidth: 1 });
      series.setData(
        values
          .map((v, i) => ({ time: points[i]!.time, value: v }))
          .filter((p): p is { time: never; value: number } => p.value !== null),
      );
    }

    if (showVolume) {
      const volSeries = chart.addSeries(HistogramSeries, {
        color: isDark ? "#27272a" : "#e4e4e7",
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });
      volSeries.setData(points.map((p) => ({ time: p.time, value: p.volume })));
      volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    }

    chart.timeScale().fitContent();

    const handleResize = (): void => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, type, indicators, showVolume, height, theme]);

  return <div ref={containerRef} className={cn("w-full", className)} style={{ height }} />;
}
```

`index.ts`:

```ts
export { PriceChart } from "./PriceChart";
export type { PriceChartIndicator, PriceChartProps, PriceChartType } from "./PriceChart.types";
```

Nota: lightweight-charts API en v5 cambió a `addSeries(SeriesType, options)`. Si la versión instalada es v4, ajustar a `chart.addCandlestickSeries(options)` etc.

Tests: 1 test mínimo verificando render sin crash. No probar lógica de chart (es DOM).

**Checkpoint Task 4.**

---

## Task 5: Componente `SparkLine`

Mini-gráfica SVG de una serie de precios. Sin ejes, sin labels — solo la línea.

```tsx
// src/components/charts/SparkLine/SparkLine.tsx
"use client";

export interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Color de la línea (CSS color). Default usa --primary. */
  stroke?: string;
  className?: string;
}

/**
 * Mini-gráfica SVG sin ejes ni labels. Útil para tablas de watchlist
 * y tarjetas resumen.
 */
export function SparkLine({ data, width = 80, height = 24, stroke, className }: SparkLineProps) {
  if (data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const positive = data[data.length - 1]! >= data[0]!;
  const color = stroke ?? (positive ? "var(--success)" : "var(--destructive)");
  return (
    <svg width={width} height={height} className={className}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}
```

`index.ts`:

```ts
export { SparkLine } from "./SparkLine";
export type { SparkLineProps } from "./SparkLine";
```

**Checkpoint Task 5.**

---

## Task 6: Use cases de watchlist (TDD)

**Files:**

- Create: `src/application/watchlist/{addToWatchlist,removeFromWatchlist,getWatchlistWithQuotes}.ts` + tests

### addToWatchlist

```ts
// src/application/watchlist/addToWatchlist.ts
import type { WatchlistItem } from "@/domain/entities/WatchlistItem";
import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";
import { Ticker } from "@/domain/value-objects/Ticker";

export interface AddToWatchlistInput {
  userId: string;
  rawTicker: string;
  notes?: string | null;
  alertPriceAbove?: number | null;
  alertPriceBelow?: number | null;
}

/**
 * Agrega una emisora al watchlist del usuario. Si ya existe (mismo ticker +
 * exchange), regresa el existente sin error.
 */
export async function addToWatchlist({
  input,
  repo,
}: {
  input: AddToWatchlistInput;
  repo: WatchlistRepository;
}): Promise<WatchlistItem> {
  const ticker = Ticker.parse(input.rawTicker);
  const existing = await repo.findByTickerAndExchange(input.userId, ticker.symbol, ticker.exchange);
  if (existing) return existing;
  return repo.create({
    userId: input.userId,
    ticker: ticker.symbol,
    exchange: ticker.exchange,
    notes: input.notes ?? null,
    alertPriceAbove: input.alertPriceAbove ?? null,
    alertPriceBelow: input.alertPriceBelow ?? null,
  });
}
```

Tests: 3 (agrega nuevo, regresa existente sin duplicar, ticker inválido lanza).

### removeFromWatchlist

```ts
// src/application/watchlist/removeFromWatchlist.ts
import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";

/**
 * Elimina un item del watchlist por id. Idempotente: si no existe, no-op.
 */
export async function removeFromWatchlist({
  id,
  repo,
}: {
  id: string;
  repo: WatchlistRepository;
}): Promise<void> {
  await repo.delete(id);
}
```

Tests: 1 (delega al repo).

### getWatchlistWithQuotes

```ts
// src/application/watchlist/getWatchlistWithQuotes.ts
import type { Quote } from "@/domain/entities/Quote";
import type { WatchlistItem } from "@/domain/entities/WatchlistItem";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";
import { Ticker } from "@/domain/value-objects/Ticker";

export interface WatchlistEntry {
  item: WatchlistItem;
  quote: Quote | null;
}

/**
 * Lista los items del watchlist enriquecidos con su quote actual.
 * Tolera fallos individuales (ticker no encontrado, mercado caído).
 */
export async function getWatchlistWithQuotes({
  userId,
  repo,
  marketData,
}: {
  userId: string;
  repo: WatchlistRepository;
  marketData: MarketDataProvider;
}): Promise<WatchlistEntry[]> {
  const items = await repo.listByUser(userId);
  return Promise.all(
    items.map(async (item) => {
      const ticker = Ticker.parse(item.exchange === "BMV" ? `${item.ticker}.MX` : item.ticker);
      let quote: Quote | null = null;
      try {
        quote = await marketData.getQuote(ticker);
      } catch {
        // tolerado
      }
      return { item, quote };
    }),
  );
}
```

Tests: 2 (con quotes, tolera fallo de quote).

**Checkpoint Task 6.**

---

## Task 7: Use case `getDashboardData`

**Goal:** Agrega datos para el dashboard: market snapshot, summary del portfolio, summary del paper portfolio, watchlist mini, últimos trades.

**Files:**

- Create: `src/application/dashboard/getDashboardData.ts` + `.test.ts`

```ts
import { computePortfolioMetrics } from "@/application/portfolio/computePortfolioMetrics";
import { getHoldings, type HoldingWithQuote } from "@/application/portfolio/getHoldings";
import {
  getPaperPortfolio,
  type PaperPortfolioState,
} from "@/application/paper-trading/getPaperPortfolio";
import {
  getWatchlistWithQuotes,
  type WatchlistEntry,
} from "@/application/watchlist/getWatchlistWithQuotes";
import type { MarketSnapshot } from "@/domain/ports/MarketDataProvider";
import type { Trade } from "@/domain/entities/Trade";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";
import type { PaperPositionRepository } from "@/domain/ports/PaperPositionRepository";
import type { TradeRepository } from "@/domain/ports/TradeRepository";
import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";

export interface DashboardData {
  marketSnapshot: MarketSnapshot;
  portfolio: {
    holdings: HoldingWithQuote[];
    metrics: ReturnType<typeof computePortfolioMetrics>;
  };
  paperPortfolio: PaperPortfolioState | null;
  watchlist: WatchlistEntry[];
  recentTrades: Trade[];
}

export interface GetDashboardDataArgs {
  userId: string;
  holdingRepo: HoldingRepository;
  tradeRepo: TradeRepository;
  paperPortfolioRepo: PaperPortfolioRepository;
  paperPositionRepo: PaperPositionRepository;
  watchlistRepo: WatchlistRepository;
  marketData: MarketDataProvider;
}

/**
 * Agrega todos los datos que el dashboard necesita en una sola llamada.
 * Tolera fallos parciales (ej. market snapshot caído) — regresa snapshot
 * vacío en ese caso para que la UI no truene.
 */
export async function getDashboardData({
  userId,
  holdingRepo,
  tradeRepo,
  paperPortfolioRepo,
  paperPositionRepo,
  watchlistRepo,
  marketData,
}: GetDashboardDataArgs): Promise<DashboardData> {
  // Disparar todas las queries en paralelo.
  const [holdingsResult, paperPortfolioResult, watchlistResult, snapshotResult, tradesResult] =
    await Promise.allSettled([
      getHoldings({ userId, holdingRepo, marketData }),
      getPaperPortfolio({ userId, paperPortfolioRepo, paperPositionRepo, marketData }),
      getWatchlistWithQuotes({ userId, repo: watchlistRepo, marketData }),
      marketData.getMarketSnapshot(),
      tradeRepo.listByUser(userId).then((all) => all.slice(0, 10)),
    ]);

  const holdings = holdingsResult.status === "fulfilled" ? holdingsResult.value : [];
  const paperPortfolio =
    paperPortfolioResult.status === "fulfilled" ? paperPortfolioResult.value : null;
  const watchlist = watchlistResult.status === "fulfilled" ? watchlistResult.value : [];
  const recentTrades = tradesResult.status === "fulfilled" ? tradesResult.value : [];

  // Si el snapshot falla, devolvemos uno vacío para que la UI no truene.
  const marketSnapshot: MarketSnapshot =
    snapshotResult.status === "fulfilled"
      ? snapshotResult.value
      : {
          ipc: {
            ticker: "IPC",
            exchange: "BMV",
            priceMxn: 0,
            priceUsd: null,
            openMxn: 0,
            highMxn: 0,
            lowMxn: 0,
            volume: 0,
            asOf: new Date(),
          },
          usdMxn: {
            ticker: "USDMXN",
            exchange: "SIC",
            priceMxn: 0,
            priceUsd: null,
            openMxn: 0,
            highMxn: 0,
            lowMxn: 0,
            volume: 0,
            asOf: new Date(),
          },
          sp500: {
            ticker: "SPX",
            exchange: "SIC",
            priceMxn: 0,
            priceUsd: null,
            openMxn: 0,
            highMxn: 0,
            lowMxn: 0,
            volume: 0,
            asOf: new Date(),
          },
          nasdaq: {
            ticker: "IXIC",
            exchange: "SIC",
            priceMxn: 0,
            priceUsd: null,
            openMxn: 0,
            highMxn: 0,
            lowMxn: 0,
            volume: 0,
            asOf: new Date(),
          },
        };

  return {
    marketSnapshot,
    portfolio: { holdings, metrics: computePortfolioMetrics(holdings) },
    paperPortfolio,
    watchlist,
    recentTrades,
  };
}
```

Test mínimo: 1 test que verifica que con todos los repos OK, regresa la estructura completa.

**Checkpoint Task 7.**

---

## Task 8: API routes

**Files:**

- Create: `src/app/api/watchlist/route.ts` (GET + POST)
- Create: `src/app/api/watchlist/[id]/route.ts` (DELETE)
- Create: `src/app/api/analysis/[ticker]/route.ts` (GET con quote + historical + indicators)
- Create: `src/app/api/dashboard/route.ts` (GET)

Patrón estándar (mismo que Plan 3 Task 6): try/catch que mapea errors a HTTP, valida con Zod cuando aplique.

### Schema para watchlist

`src/lib/schemas/watchlist.ts`:

```ts
import { z } from "zod";

export const addToWatchlistSchema = z.object({
  ticker: z.string().min(1).max(20),
  notes: z.string().max(500).nullable().default(null),
  alertPriceAbove: z.number().positive().nullable().default(null),
  alertPriceBelow: z.number().positive().nullable().default(null),
});

export type AddToWatchlistFormInput = z.input<typeof addToWatchlistSchema>;
```

### `/api/watchlist` GET y POST

```ts
import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { addToWatchlist } from "@/application/watchlist/addToWatchlist";
import { getWatchlistWithQuotes } from "@/application/watchlist/getWatchlistWithQuotes";
import { DomainError } from "@/domain/errors/DomainError";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { addToWatchlistSchema } from "@/lib/schemas/watchlist";

export async function GET() {
  try {
    const userId = await requireUserId();
    const { watchlist, marketData } = getDeps();
    const entries = await getWatchlistWithQuotes({ userId, repo: watchlist, marketData });
    return NextResponse.json({ entries });
  } catch (e) {
    return mapError(e, "/api/watchlist GET");
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = addToWatchlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { watchlist } = getDeps();
    const item = await addToWatchlist({
      input: { userId, rawTicker: parsed.data.ticker, ...parsed.data },
      repo: watchlist,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return mapError(e, "/api/watchlist POST");
  }
}

function mapError(e: unknown, path: string): Response {
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

### `/api/watchlist/[id]` DELETE

```ts
import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { removeFromWatchlist } from "@/application/watchlist/removeFromWatchlist";
import { requireUserId } from "@/infrastructure/auth/clerk";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUserId();
    const { id } = await params;
    const { watchlist } = getDeps();
    await removeFromWatchlist({ id, repo: watchlist });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("/api/watchlist/[id] DELETE error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
```

### `/api/analysis/[ticker]` GET

```ts
import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { computeMACD, computeRSI, computeSMA } from "@/application/analysis/computeIndicators";
import { getHistoricalPrices } from "@/application/quotes/getHistoricalPrices";
import { getQuote } from "@/application/quotes/getQuote";
import { DomainError } from "@/domain/errors/DomainError";
import type { TimeRange } from "@/domain/entities/HistoricalPrice";
import { requireUserId } from "@/infrastructure/auth/clerk";

const VALID_RANGES: readonly TimeRange[] = ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y", "ALL"];

export async function GET(req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  try {
    await requireUserId();
    const { ticker } = await params;
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get("range") ?? "3M";
    const range: TimeRange = VALID_RANGES.includes(rangeParam as TimeRange)
      ? (rangeParam as TimeRange)
      : "3M";

    const { marketData } = getDeps();
    const [quote, historical] = await Promise.all([
      getQuote({ provider: marketData, rawTicker: ticker }),
      getHistoricalPrices({ provider: marketData, rawTicker: ticker, range }),
    ]);
    const closes = historical.map((h) => h.close);
    const indicators = {
      sma20: computeSMA(closes, 20),
      sma50: computeSMA(closes, 50),
      rsi14: computeRSI(closes, 14),
      macd: computeMACD(closes),
    };
    return NextResponse.json({ quote, historical, indicators });
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
    console.error("/api/analysis/[ticker] error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
```

### `/api/dashboard` GET

```ts
import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { getDashboardData } from "@/application/dashboard/getDashboardData";
import { requireUserId } from "@/infrastructure/auth/clerk";

export async function GET() {
  try {
    const userId = await requireUserId();
    const deps = getDeps();
    const data = await getDashboardData({
      userId,
      holdingRepo: deps.holdings,
      tradeRepo: deps.trades,
      paperPortfolioRepo: deps.paperPortfolio,
      paperPositionRepo: deps.paperPosition,
      watchlistRepo: deps.watchlist,
      marketData: deps.marketData,
    });
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("/api/dashboard error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
```

**Checkpoint Task 8.**

---

## Task 9: Hooks

**Files:**

- Create: `src/hooks/useWatchlist.ts`, `useAnalysis.ts`, `useDashboard.ts`

Patrón estándar de TanStack Query (igual que `usePortfolio`):

```ts
// useWatchlist
import { useQuery } from "@tanstack/react-query";

import type { WatchlistEntry } from "@/application/watchlist/getWatchlistWithQuotes";

export function useWatchlist() {
  return useQuery<{ entries: WatchlistEntry[] }>({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const res = await fetch("/api/watchlist");
      if (!res.ok) throw new Error("failed to fetch watchlist");
      return res.json();
    },
  });
}
```

`useAnalysis(ticker, range)`: queryKey = `["analysis", ticker, range]`. Llama a `/api/analysis/${ticker}?range=${range}`.

`useDashboard()`: queryKey = `["dashboard"]`. Llama a `/api/dashboard`.

**Checkpoint Task 9.**

---

## Task 10: Página `/watchlist`

Reemplazar el placeholder. Header + form para agregar emisora + tabla de entries.

`src/app/(app)/watchlist/page.tsx`:

```tsx
import { WatchlistPageClient } from "./WatchlistPageClient";

export default function WatchlistPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
        <p className="text-muted-foreground text-sm">
          Emisoras que sigues con su cotización actual.
        </p>
      </div>
      <WatchlistPageClient />
    </div>
  );
}
```

`src/app/(app)/watchlist/WatchlistPageClient.tsx`:

Tabla con columnas: Ticker (TickerBadge + ExchangeBadge), Precio (MoneyDisplay), Cambio del día (PnLBadge), Notas, Acciones (botón Eliminar).

Header con `<AddWatchlistForm>` que es un input simple con botón "Agregar". POST a `/api/watchlist` y reactualiza el cache.

**Checkpoint Task 10.**

---

## Task 11: Página `/analysis/[ticker]`

`src/app/(app)/analysis/[ticker]/page.tsx`:

```tsx
import { AnalysisPageClient } from "./AnalysisPageClient";

export default async function TickerAnalysisPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <AnalysisPageClient ticker={ticker} />
    </div>
  );
}
```

`AnalysisPageClient.tsx` (cliente):

Layout:

1. Header: TickerBadge grande + ExchangeBadge + Precio actual (MoneyDisplay lg) + PnLBadge del día.
2. Selector de timeframe (botones 1D, 5D, 1M, 3M, 6M, 1Y, 5Y).
3. PriceChart con velas + SMA20 + SMA50 + Volume.
4. Grid de MetricCards: P/E, Dividend Yield, Market Cap, Volume, RSI14, etc. (los que tenga el quote disponible — `priceMxn` siempre, los fundamentales pueden ser null).
5. Cada MetricCard incluye `<MetricTooltip concept="..." />` para los conceptos que tengan slug en CONCEPTS.

Botones de acción: "Agregar a watchlist", "Comprar (paper)", "Comprar (real)".

Para `/analysis` (sin ticker): página simple con un input "Buscar emisora..." que al submit redirige a `/analysis/${ticker}`.

**Checkpoint Task 11.**

---

## Task 12: Página `/dashboard`

Reemplazar el placeholder con el dashboard real.

`src/app/(app)/dashboard/page.tsx` (mantiene Server Component, agrega Client subcomponent):

Layout:

1. Saludo "Hola, [usuario]" (existing — reusar `currentUser()`).
2. **Market snapshot**: 4 MetricCards arriba con IPC, USD/MXN, S&P 500, NASDAQ. Cada uno con sparkline mini opcional.
3. **Portafolio Real**: Card con resumen — valor total, P&L, link "Ver portafolio".
4. **Paper Portfolio**: Card similar con equity total, retorno, link.
5. **Watchlist mini**: Card con las primeras 5 emisoras del watchlist + sparklines.
6. **Últimos trades**: Card con los últimos 5 trades reales.

Toda la data viene del hook `useDashboard()`.

**Checkpoint Task 12.**

---

## Task 13: Validación final

```bash
cd /Users/noel/REPOS/BMV-Stock
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Verificar nuevas rutas en build:

- `/api/watchlist`
- `/api/watchlist/[id]`
- `/api/analysis/[ticker]`
- `/api/dashboard`
- `/watchlist` (reemplazada)
- `/analysis` (reemplazada con search)
- `/analysis/[ticker]` (nueva)
- `/dashboard` (reemplazada con datos reales)

Tests count esperado: 119 + ~25 nuevos (5 SMA + 2 EMA + 3 RSI + 2 MACD + 3 watchlist + 1 dashboard + 5 componentes + algún edge) = ~144.

---

## Lo que sigue (Plan 5)

- Landing pública completa (Hero, FeatureGrid, HowItWorks, Disclaimer, Footer).
- Modal de disclaimer al primer login.
- Página `/settings` real.
- Página `/core-allocation` con calculadora.
- Cron de Vercel para pre-cache de watchlist + holdings.
- Fix de pnpm/React duplicado (cleanup del runtime patch).
- README final con stack, setup, deploy.
- Migración `middleware.ts` → `proxy.ts` para Next.js 16.
