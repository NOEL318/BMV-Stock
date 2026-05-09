# BMV Stock — Diseño v1

> Sistema personal de análisis, paper trading y gestión de portafolio para inversionistas individuales en GBM México.
> Operación final manual en GBM+; el sistema asiste con análisis, simulación y registro.

**Fecha:** 2026-05-06
**Estado:** Diseño aprobado, pendiente de implementación
**Nombre del proyecto:** `bmv-stock` (provisional, renombrable)

---

## 1. Resumen ejecutivo

Aplicación web personal para un inversionista individual que opera en GBM México. Ayuda a _aprender invirtiendo_ y _gestionar lo que ya tiene_ sin tomar decisiones por el usuario. Combina:

- **Dashboard de análisis** con indicadores técnicos y fundamentales explicados en lenguaje claro.
- **Paper trading** con $100,000 MXN ficticios para practicar sin riesgo.
- **Gestión de portafolio real**: registra posiciones manualmente, calcula P&L, peso por sector, comparativa vs IPC.
- **Watchlist** de emisoras seguidas.
- **Calculadora de "núcleo aburrido"** que sugiere asignación base en ETFs según perfil de riesgo.

**Restricción clave:** GBM+ retail no expone API pública. Las órdenes se siguen ejecutando manualmente en la app de GBM; este sistema vive _alrededor_ de esa operación, no la reemplaza.

**Costo operativo:** $0/mes en uso personal (Vercel Hobby + Neon Free + Clerk Free).

---

## 2. Objetivos y no-objetivos

### Objetivos

1. Ayudar al usuario a tomar decisiones más informadas mediante análisis técnico/fundamental con explicación pedagógica.
2. Permitir practicar estrategias con dinero ficticio antes de arriesgar capital real.
3. Llevar un registro fidedigno de posiciones reales y calcular P&L en tiempo casi-real.
4. Educar continuamente: cada métrica relevante incluye tooltip con su definición, interpretación y caveats.
5. Promover una asignación responsable mediante recomendación de núcleo en ETFs.

### No-objetivos (v1)

- **No** ejecuta órdenes en GBM+ ni intermedia.
- **No** es asesoría financiera regulada.
- **No** calcula impuestos (ISR, retenciones de dividendos) — v2.
- **No** soporta backtesting de estrategias — v2.
- **No** soporta screening avanzado (filtros sobre todo el universo BMV) — v2.
- **No** envía alertas automáticas — v2 (los campos del schema existen pero la lógica de notificación no).
- **No** soporta múltiples portafolios paper — un solo simulador por usuario.
- **No** soporta cripto ni forex.
- **No** es multi-tenant — está pensado para uso personal del propietario.

---

## 3. Usuario

- Una sola persona (el propietario), allowlisted por email en Clerk.
- Perfil: inversionista individual principiante-intermedio, con cuenta GBM+ activa, dispuesto a dedicar 2–5 hrs/semana.
- Quiere aprender análisis técnico y fundamental, revisar portafolio frecuentemente, y a veces ejecutar trades activos sobre una base de ETFs.

---

## 4. Decisiones de producto clave

| Decisión                    | Elección                                                                                        | Razón                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Núcleo / satélite           | El sistema sugiere un núcleo de ETFs y separa "portafolio de aprendizaje" donde se opera activo | Estadísticamente, retail activo pierde contra el índice; queremos exponer eso como guardrail |
| Paper trading antes de real | Sí, prominente desde el primer login                                                            | Permite equivocarse gratis; reduce el costo de aprender                                      |
| Universo                    | BMV mexicana + SIC (acciones e ETFs internacionales vía SIC)                                    | Es exactamente lo que el usuario puede comprar en GBM+                                       |
| Datos                       | Yahoo Finance free vía `yahoo-finance2`                                                         | Cobertura suficiente, sin API key, sin costo. Retraso ~15-20 min asumido                     |
| Operación                   | Manual: el usuario registra trades reales después de ejecutarlos en GBM+                        | GBM+ no tiene API retail; alternativas (scraping) son frágiles y posiblemente contra ToS     |
| Multi-usuario               | No; allowlist a un solo email                                                                   | Es uso personal; simplifica radicalmente seguridad y datos                                   |

---

## 5. Stack tecnológico

### Frontend / Framework

- **Next.js 15** (App Router) + **TypeScript strict**
- **TanStack Query** para fetch/cache en el cliente
- **react-hook-form** + **Zod** para formularios
- **Tailwind CSS** + **shadcn/ui** (Radix + CVA) para UI
- **React Icons** + iconos Lucide (default de shadcn)
- **next-themes** para light/dark mode
- **Lightweight Charts** (TradingView, gratis) para gráficas de precio (velas, líneas, sparklines)

### Backend / Datos

- **Next.js Route Handlers** (`app/api/*`) — sin servidor separado
- **PostgreSQL** en **Neon** (free tier 0.5 GB)
- **Drizzle ORM** + **drizzle-kit** para migraciones
- **`yahoo-finance2`** (npm) — fuente de datos de mercado

### Auth

- **Clerk** (free tier, hasta 10,000 MAU). Allowlist en dashboard de Clerk con un solo email autorizado.
- Magic link por email + Google sign-in.

### Tooling

- **pnpm** como package manager
- **ESLint** (config `next/core-web-vitals` + `eslint-plugin-import` + `eslint-plugin-tsdoc`)
- **Prettier**
- **Vitest** + **@testing-library/react** + **jsdom** para tests
- **GitHub Actions**: lint + typecheck + tests + drizzle migration check en cada PR

### Hosting

- **Vercel Hobby** (gratis para proyectos personales)
- **Neon** para Postgres (free tier)
- **Clerk** (free tier)
- **Resend** opcional para emails transaccionales (Clerk lo maneja por default; Resend solo si v2 agrega notificaciones propias)

---

## 6. Arquitectura

### Capas (clean architecture)

```
┌──────────────────────────────────────────────────────┐
│  Presentation                                        │
│  src/app/**, src/components/**                       │
│  - React, Next.js routing, UI                        │
│  - Llama a application                               │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│  Application                                         │
│  src/application/**                                  │
│  - Use cases, orquestación                           │
│  - Llama a domain (puro) y a interfaces (ports) de   │
│    infrastructure                                    │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│  Domain                                              │
│  src/domain/**                                       │
│  - Entities, value objects, errors, ports            │
│  - Cero dependencias externas (ni React, ni DB)      │
└──────────────────────────────────────────────────────┘
                         ▲
                         │ implementa
┌────────────────────────┴─────────────────────────────┐
│  Infrastructure                                      │
│  src/infrastructure/**                               │
│  - DB (Drizzle), Yahoo Finance, Clerk, cache         │
│  - Implementa los ports definidos en domain          │
└──────────────────────────────────────────────────────┘
```

**Reglas estrictas (lint las debe enforcer):**

- `domain` no importa nada fuera de `domain`.
- `application` solo importa de `domain` (incluyendo ports).
- `infrastructure` importa de `domain` y opcionalmente de `application`.
- `app` y `components` solo deben llamar a `application` (use cases) o leer tipos de `domain`. Nunca llaman a `infrastructure` directamente.

Esta regla se enforza con `eslint-plugin-import` + `import/no-restricted-paths`.

### Estructura completa del repo

```
bmv-stock/
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-05-06-bmv-stock-design.md   ← este archivo
├── drizzle/                       ← migraciones SQL generadas
├── public/                        ← assets estáticos
├── src/
│   ├── app/                       ← Presentation (Next.js routes)
│   │   ├── (public)/              ← Layout para rutas públicas
│   │   │   ├── page.tsx           ← Landing
│   │   │   └── layout.tsx
│   │   ├── (app)/                 ← Layout autenticado
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── portfolio/
│   │   │   ├── paper-trading/
│   │   │   ├── watchlist/
│   │   │   ├── analysis/[ticker]/page.tsx
│   │   │   ├── core-allocation/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   ├── api/                   ← Route handlers
│   │   │   ├── quotes/route.ts
│   │   │   ├── portfolio/route.ts
│   │   │   ├── paper-trades/route.ts
│   │   │   ├── watchlist/route.ts
│   │   │   └── ...
│   │   └── layout.tsx             ← Root layout (Clerk, Theme, QueryClient providers)
│   │
│   ├── domain/                    ← Reglas de negocio puras
│   │   ├── entities/
│   │   │   ├── User.ts
│   │   │   ├── Holding.ts
│   │   │   ├── Trade.ts
│   │   │   ├── PaperPortfolio.ts
│   │   │   ├── PaperPosition.ts
│   │   │   ├── PaperTrade.ts
│   │   │   ├── WatchlistItem.ts
│   │   │   └── UserPreferences.ts
│   │   ├── value-objects/
│   │   │   ├── Money.ts
│   │   │   ├── Ticker.ts
│   │   │   └── Percentage.ts
│   │   ├── errors/
│   │   │   ├── DomainError.ts
│   │   │   ├── InsufficientFundsError.ts
│   │   │   ├── InvalidTickerError.ts
│   │   │   ├── TickerNotFoundError.ts
│   │   │   └── MarketDataUnavailableError.ts
│   │   └── ports/                 ← Interfaces que infrastructure implementa
│   │       ├── MarketDataProvider.ts
│   │       ├── HoldingRepository.ts
│   │       ├── TradeRepository.ts
│   │       ├── PaperPortfolioRepository.ts
│   │       ├── WatchlistRepository.ts
│   │       └── UserPreferencesRepository.ts
│   │
│   ├── application/               ← Use cases
│   │   ├── portfolio/
│   │   │   ├── recordRealTrade.ts
│   │   │   ├── getHoldings.ts
│   │   │   ├── computePortfolioMetrics.ts
│   │   │   └── getSectorAllocation.ts
│   │   ├── paper-trading/
│   │   │   ├── executePaperTrade.ts
│   │   │   ├── getPaperPortfolio.ts
│   │   │   └── resetPaperPortfolio.ts
│   │   ├── quotes/
│   │   │   ├── getQuote.ts
│   │   │   ├── getHistoricalPrices.ts
│   │   │   └── getMarketSnapshot.ts
│   │   ├── analysis/
│   │   │   ├── computeIndicators.ts        ← RSI, MACD, SMA, EMA
│   │   │   ├── getFundamentals.ts
│   │   │   └── compareToBenchmark.ts
│   │   ├── watchlist/
│   │   │   ├── addToWatchlist.ts
│   │   │   ├── removeFromWatchlist.ts
│   │   │   └── getWatchlist.ts
│   │   └── core-allocation/
│   │       └── recommendAllocation.ts
│   │
│   ├── infrastructure/            ← Adaptadores
│   │   ├── db/
│   │   │   ├── client.ts          ← Drizzle client
│   │   │   ├── schema.ts          ← Drizzle schema
│   │   │   └── repositories/
│   │   │       ├── DrizzleHoldingRepository.ts
│   │   │       ├── DrizzleTradeRepository.ts
│   │   │       ├── DrizzlePaperPortfolioRepository.ts
│   │   │       ├── DrizzleWatchlistRepository.ts
│   │   │       └── DrizzleUserPreferencesRepository.ts
│   │   ├── market-data/
│   │   │   ├── YahooMarketDataProvider.ts
│   │   │   └── CachedMarketDataProvider.ts   ← Decorator que cachea en DB
│   │   └── auth/
│   │       └── clerk.ts           ← getCurrentUser(), getUserId()
│   │
│   ├── components/                ← UI reusable
│   │   ├── ui/                    ← shadcn primitives (Button, Card, Dialog, ...)
│   │   ├── layout/                ← Sidebar, TopNav, PageHeader, AuthGuard, EmptyState
│   │   │   ├── Sidebar/
│   │   │   ├── TopNav/
│   │   │   ├── PageHeader/
│   │   │   └── EmptyState/
│   │   ├── finance/               ← MetricCard, TickerBadge, MoneyDisplay, PnLBadge
│   │   ├── charts/                ← PriceChart, SparkLine, IndicatorOverlay
│   │   ├── tables/                ← DataTable, PortfolioTable, TradeHistoryTable
│   │   ├── forms/                 ← TradeForm, PositionForm
│   │   ├── education/             ← MetricTooltip, ConceptCard, ConceptDrawer
│   │   └── landing/               ← Hero, FeatureGrid, HowItWorks, Disclaimer
│   │
│   ├── contexts/                  ← React Context providers
│   │   ├── PreferencesContext/
│   │   └── ToastContext/          ← (si shadcn no cubre todo)
│   │
│   ├── hooks/                     ← Hooks compartidos
│   │   ├── useQuote.ts
│   │   ├── usePortfolio.ts
│   │   ├── usePaperPortfolio.ts
│   │   ├── useWatchlist.ts
│   │   └── usePreferences.ts
│   │
│   └── lib/
│       ├── schemas/               ← Zod schemas compartidos frontend/backend
│       ├── format/                ← formatMxn, formatPercent, formatDate
│       ├── constants/             ← MARKET_HOURS, RISK_PROFILES, etc.
│       └── concepts/              ← Definiciones educativas (RSI, P/E, etc.) en TS
│
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 7. Modelo de datos

### Filosofía

Los **trades** (compras, ventas, dividendos) son la fuente de verdad inmutable. Las **posiciones** son una vista derivada que el sistema mantiene actualizada al ejecutar cada trade. Esto da bitácora completa, permite auditoría y tolera recálculos.

### Entidades de dominio

#### `User`

| Campo     | Tipo                  | Notas |
| --------- | --------------------- | ----- |
| id        | string (Clerk userId) | PK    |
| email     | string                | único |
| createdAt | Date                  |       |

#### `Holding` (posición real actual)

| Campo                | Tipo                | Notas                     |
| -------------------- | ------------------- | ------------------------- |
| id                   | uuid                | PK                        |
| userId               | string              | FK                        |
| ticker               | string              | ej. `WALMEX.MX`, `AAPL`   |
| exchange             | enum (`BMV`, `SIC`) |                           |
| quantity             | numeric(20,8)       | soporta fracciones        |
| avgCostMxn           | numeric(20,4)       | en MXN siempre            |
| openedAt             | Date                | fecha del primer BUY      |
| closedAt             | Date \| null        | cuando quantity llega a 0 |
| notes                | text \| null        |                           |
| createdAt, updatedAt | Date                |                           |

**Invariante:** un holding con `quantity = 0` se marca con `closedAt`; no se elimina (queda para historial).

#### `Trade` (trade real registrado)

| Campo            | Tipo                             | Notas                                          |
| ---------------- | -------------------------------- | ---------------------------------------------- |
| id               | uuid                             | PK                                             |
| userId           | string                           | FK                                             |
| ticker, exchange |                                  | igual a Holding                                |
| action           | enum (`BUY`, `SELL`, `DIVIDEND`) |                                                |
| quantity         | numeric(20,8)                    | para DIVIDEND, qty=1 y priceMxn=monto recibido |
| priceMxn         | numeric(20,4)                    | precio por unidad en MXN                       |
| commissionMxn    | numeric(20,4)                    | default 0                                      |
| executedAt       | Date                             | cuando ocurrió en GBM+                         |
| notes            | text \| null                     |                                                |
| createdAt        | Date                             | cuando lo registró el usuario                  |

**Reglas de cálculo del Holding al ejecutar Trade:**

- BUY: `newAvgCost = (oldQty * oldAvgCost + qty * price + commission) / (oldQty + qty)`; `newQty = oldQty + qty`.
- SELL: `newQty = oldQty - qty`. avgCost no cambia. Si `newQty = 0`, marcar `closedAt`.
- DIVIDEND: no afecta quantity ni avgCost; queda en historial.

#### `PaperPortfolio`

| Campo             | Tipo          | Notas                                           |
| ----------------- | ------------- | ----------------------------------------------- |
| id                | uuid          | PK                                              |
| userId            | string        | FK, único (un solo paper portfolio por usuario) |
| name              | string        | default "Mi portafolio de práctica"             |
| cashBalanceMxn    | numeric(20,2) | inicial: 100,000.00                             |
| initialBalanceMxn | numeric(20,2) | 100,000.00; se usa para calcular retorno total  |
| createdAt         | Date          |                                                 |
| resetAt           | Date \| null  | última vez que se reseteó                       |

#### `PaperPosition`

Misma estructura que `Holding` pero con `paperPortfolioId` en vez de `userId`.

#### `PaperTrade`

Misma estructura que `Trade` pero:

- Sin DIVIDEND (no se simulan dividendos en v1).
- Sin `commissionMxn` (paper trading no cobra comisión).
- Validación adicional: BUY exige `cashBalanceMxn >= qty * price` o lanza `InsufficientFundsError`.

#### `WatchlistItem`

| Campo            | Tipo            | Notas                |
| ---------------- | --------------- | -------------------- |
| id               | uuid            | PK                   |
| userId           | string          | FK                   |
| ticker, exchange |                 |                      |
| addedAt          | Date            |                      |
| alertPriceAbove  | numeric \| null | v2: lógica de alerta |
| alertPriceBelow  | numeric \| null | v2                   |
| notes            | text \| null    |                      |

#### `UserPreferences`

| Campo                | Tipo                                          | Notas                 |
| -------------------- | --------------------------------------------- | --------------------- |
| userId               | string                                        | PK + FK               |
| displayCurrency      | enum (`MXN`, `USD`)                           | default `MXN`         |
| defaultTimeframe     | enum (`1D`,`5D`,`1M`,`3M`,`6M`,`1Y`,`5Y`)     | default `3M`          |
| theme                | enum (`light`,`dark`,`system`)                | default `system`      |
| tableDensity         | enum (`compact`,`comfortable`)                | default `comfortable` |
| riskProfile          | enum (`CONSERVATIVE`,`MODERATE`,`AGGRESSIVE`) | default `MODERATE`    |
| disclaimerAcceptedAt | Date \| null                                  | null = no ha aceptado |

### Value Objects

- **`Money`** — `{ amount: number, currency: 'MXN' \| 'USD' }`. Métodos: `add`, `subtract`, `multiply`, `convert(rate)`. Lanza error si se intenta sumar monedas distintas sin conversión explícita.
- **`Ticker`** — valida formato. Expone `symbol`, `exchange` (`BMV` si termina en `.MX`, `SIC` si no), `yahooSymbol`.
- **`Percentage`** — `{ value: number }`. Constructor `fromDecimal(0.05)` → 5%; `fromPercent(5)` → 5%. Métodos: `apply(amount)`, `toString()`.

### Cache (solo `infrastructure`)

#### `quote_cache`

| Campo                    | Tipo            | Notas                             |
| ------------------------ | --------------- | --------------------------------- |
| ticker                   | string          | PK compuesta (ticker, exchange)   |
| exchange                 | enum            |                                   |
| priceUsd                 | numeric \| null | si SIC                            |
| priceMxn                 | numeric         | siempre, calculado al spot si SIC |
| openMxn, highMxn, lowMxn | numeric         |                                   |
| volume                   | bigint          |                                   |
| asOf                     | Date            | timestamp del dato de Yahoo       |
| fetchedAt                | Date            | cuando lo guardamos               |

TTL lógico: 10 minutos. Si `now - fetchedAt > 10min`, refrescar de Yahoo.

#### `historical_price`

| Campo                  | Tipo    | Notas       |
| ---------------------- | ------- | ----------- |
| ticker, exchange       |         | parte de PK |
| date                   | date    | parte de PK |
| open, high, low, close | numeric | en MXN      |
| volume                 | bigint  |             |
| fetchedAt              | Date    |             |

Llenado bajo demanda al ver gráficas; se conservan permanentemente.

---

## 8. Páginas y rutas

| Ruta                       | Acceso  | Propósito                                                                                                               |
| -------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `/`                        | Pública | Landing: hero, "Cómo funciona", features, disclaimer, CTA "Iniciar sesión"                                              |
| `/sign-in/*`, `/sign-up/*` | Pública | UI de Clerk                                                                                                             |
| `/dashboard`               | Auth    | Vista general: market snapshot (IPC, USD/MXN, S&P), tarjetas de Portafolio Real + Paper, mini-watchlist, últimos trades |
| `/portfolio`               | Auth    | Holdings reales: tabla con P&L, peso por sector, comparativa vs IPC, dividendos esperados                               |
| `/portfolio/trade`         | Auth    | Form para registrar trade real (BUY/SELL/DIVIDEND)                                                                      |
| `/paper-trading`           | Auth    | Portafolio simulado, posiciones, balance disponible, botón "Reset"                                                      |
| `/paper-trading/trade`     | Auth    | Form para paper trade con validación de fondos                                                                          |
| `/paper-trading/history`   | Auth    | Historial completo de paper trades                                                                                      |
| `/watchlist`               | Auth    | Tickers seguidos con sparklines, métricas y alertas configuradas                                                        |
| `/analysis/[ticker]`       | Auth    | Pantalla de análisis: gráfica de velas, indicadores con tooltips educativos, fundamentales, acciones rápidas            |
| `/core-allocation`         | Auth    | Calculadora del núcleo aburrido según `riskProfile`                                                                     |
| `/settings`                | Auth    | Editar `UserPreferences`                                                                                                |

### Flujos críticos

**Primer login:**

1. Clerk autentica → middleware redirige a `/dashboard`.
2. Si `UserPreferences.disclaimerAcceptedAt` es null → modal bloqueante con disclaimer + checkbox "Entiendo y acepto".
3. Al aceptar, se setea `disclaimerAcceptedAt = now` y se cierra el modal.

**Registrar trade real (BUY):**

1. Usuario llena form en `/portfolio/trade`.
2. Validación Zod en cliente y server.
3. Server llama a `recordRealTrade` use case.
4. Use case: inserta `Trade` y actualiza/crea `Holding` en una transacción.
5. Invalida cache de TanStack Query para `usePortfolio()`.
6. Redirect a `/portfolio` con toast de éxito.

**Ejecutar paper trade (BUY):**

1. Form en `/paper-trading/trade` con autocomplete de ticker.
2. Server llama a `executePaperTrade` use case.
3. Use case lee `quote_cache` para precio actual y valida `cashBalanceMxn >= qty * price`. Si no, lanza `InsufficientFundsError` que se traduce a 400 con mensaje claro.
4. En transacción: inserta `PaperTrade`, actualiza/crea `PaperPosition`, descuenta `cashBalanceMxn`.

---

## 9. Componentes

### Estructura de un componente

Cada componente tiene su propio folder con archivos separados:

```
src/components/finance/MetricCard/
├── MetricCard.tsx          ← Solo JSX (presentacional puro)
├── MetricCard.logic.ts     ← Funciones puras y hooks (formateo, cálculo)
├── MetricCard.styles.ts    ← Variantes con CVA
├── MetricCard.types.ts     ← Props interface y tipos públicos
├── MetricCard.test.tsx     ← Tests con Vitest + Testing Library
└── index.ts                ← Barrel export
```

### Convenciones por archivo

- **`.tsx`** — solo render. Recibe props ya procesadas. Sin fetch, sin formateo. Esto lo hace fácil de probar sin red.
- **`.logic.ts`** — funciones puras y custom hooks. Si el componente necesita datos del servidor, este archivo expone un hook que usa TanStack Query.
- **`.styles.ts`** — CVA variants (patrón shadcn estándar):

  ```ts
  export const metricCardVariants = cva("rounded-md border", {
    variants: {
      size: { sm: "p-2 text-sm", md: "p-3", lg: "p-4 text-lg" },
      variant: {
        bordered: "bg-card",
        filled: "bg-muted",
        ghost: "bg-transparent border-transparent",
      },
      emphasis: { neutral: "", positive: "border-emerald-500/30", negative: "border-red-500/30" },
    },
    defaultVariants: { size: "md", variant: "bordered", emphasis: "neutral" },
  });
  ```

- **`.types.ts`** — `Props` interface y tipos exportables. Importable sin traer la implementación.
- **`.test.tsx`** — tests del render. Tests de `.logic.ts` van en `.logic.test.ts` separados.
- **`index.ts`** — solo re-exporta:

  ```ts
  export { MetricCard } from "./MetricCard";
  export type { MetricCardProps } from "./MetricCard.types";
  ```

### Separación container / presentational

Cuando un componente necesita datos del servidor:

```
src/components/tables/PortfolioTable/         ← Container: usa hooks de TanStack Query
src/components/tables/PortfolioTableView/     ← Presentational: solo recibe props
```

`PortfolioTable` llama a `usePortfolio()`, maneja loading/error states, y pasa los datos limpios a `PortfolioTableView`. El presentational es 100% testeable sin mocks.

### Componentes con props ricas

Filosofía: cada componente reusable expone tantas opciones como tenga sentido vía variants/props. Ejemplos:

```tsx
<MetricCard
  label="P/E"
  value={18.4}
  format="number"          // number | currency | percent
  precision={1}
  trend="down"             // up | down | flat
  delta={-2.1}
  tooltip={<MetricTooltip concept="pe-ratio" />}
  size="md"                // sm | md | lg
  variant="bordered"       // bordered | filled | ghost
  emphasis="neutral"       // neutral | positive | negative
  onClick={...}
/>

<PriceChart
  ticker="WALMEX.MX"
  timeframe="3M"           // 1D | 5D | 1M | 3M | 6M | 1Y | 5Y | ALL
  type="candles"           // candles | line | area
  indicators={["sma20", "sma50", "rsi"]}
  showVolume
  height={420}
  theme="auto"             // auto | light | dark
  onCrosshairMove={...}
/>

<DataTable
  data={positions}
  columns={[...]}
  sortable
  filterable
  pagination={{ pageSize: 20 }}
  emptyState={<EmptyPortfolio />}
  density="comfortable"
  rowActions={[...]}
/>
```

### React Context

Solo donde Context es la herramienta correcta:

| Context                            | Uso                                                   |
| ---------------------------------- | ----------------------------------------------------- |
| `ThemeContext` (vía `next-themes`) | Light/dark mode                                       |
| `AuthContext` (Clerk)              | Identidad del usuario                                 |
| `PreferencesContext`               | `displayCurrency`, `defaultTimeframe`, `tableDensity` |
| `ToastContext`                     | Notificaciones                                        |

**No va en Context:**

- Datos del servidor (precios, portafolio) → TanStack Query.
- Estado local de un componente → `useState`.
- Estado de form → `react-hook-form`.

Cada context expone su provider + hook (`usePreferences()`) y el hook lanza error si se usa fuera del provider.

---

## 10. Integraciones externas

### Yahoo Finance (`yahoo-finance2`)

- Puerto: `MarketDataProvider` en `domain/ports/`. Métodos:
  - `getQuote(ticker: Ticker): Promise<Quote>`
  - `getHistorical(ticker: Ticker, range: TimeRange): Promise<HistoricalPrice[]>`
  - `getFundamentals(ticker: Ticker): Promise<Fundamentals>`
  - `getMarketSnapshot(): Promise<MarketSnapshot>` (IPC, USDMXN, SPX, NASDAQ)
- Implementación: `YahooMarketDataProvider` en `infrastructure/market-data/`.
- Decorator: `CachedMarketDataProvider` envuelve a Yahoo y consulta primero `quote_cache`. Si TTL no expirado, retorna del cache; si no, pega a Yahoo y persiste.
- **Tickers BMV**: sufijo `.MX`.
- **Tickers SIC**: ticker USA (`AAPL`). El provider hace una segunda llamada a `USDMXN=X` y calcula `priceMxn = priceUsd * usdMxn`. Ambos se persisten.
- **Errores**:
  - Ticker inválido → `TickerNotFoundError` (dominio).
  - Yahoo down/timeout → `MarketDataUnavailableError` con mensaje amigable en UI.

### Clerk (auth)

- `<ClerkProvider>` en `app/layout.tsx`.
- `clerkMiddleware()` en `middleware.ts`. Rutas públicas declaradas explícitamente: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks(.*)`.
- **Allowlist**: en dashboard de Clerk → "Restrictions" → "Restrict sign-ups by allowlist" → agregar email autorizado.
- Helper `getCurrentUser()` en `infrastructure/auth/clerk.ts`:
  ```ts
  /**
   * Recupera el usuario autenticado de Clerk y lo mapea a la entidad de dominio User.
   * Lanza UnauthorizedError si no hay sesión.
   */
  export async function getCurrentUser(): Promise<User> { ... }
  ```

### Vercel deployment

- `git push origin main` → build + deploy automático.
- Preview deploys en cada PR.
- Variables de entorno (Production + Preview):
  ```
  DATABASE_URL                          ← Neon pooled
  DATABASE_URL_UNPOOLED                 ← Neon directo (migraciones)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  CLERK_SECRET_KEY
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  ```
- **Migraciones**: GitHub Action corre `pnpm drizzle-kit migrate` contra `DATABASE_URL_UNPOOLED` antes del deploy. Falla el build si una migración rompe.
- **Cron Vercel** (1 job): `0 23 * * *` (23:00 CDMX) precarga precios de cierre de watchlist + holdings → al abrir la app a la mañana siguiente todo está cacheado.

### Validación

- Schemas Zod en `lib/schemas/` se reusan en frontend (forms con `zodResolver`) y backend (Route Handlers). Una sola fuente de verdad.

### Observabilidad

- v1: `console.error` con contexto estructurado. Vercel logs los recoge.
- v2: Sentry o Axiom (free tier).

---

## 11. Auth y seguridad

- Single-user mediante allowlist de Clerk. Cualquier sign-up con email no autorizado falla en Clerk antes de tocar el sistema.
- Todas las Route Handlers que manipulan datos llaman `auth()` de Clerk al inicio. `userId` null → 401.
- Todas las queries a DB filtran por `userId` (incluso siendo single-user, defense in depth).
- Inputs validados con Zod antes de llegar al use case.
- No se almacenan secretos del usuario en DB. Clerk maneja sesiones y JWTs.
- HTTPS siempre (Vercel default). HSTS habilitado vía `next.config.ts` headers.
- CSP estricta vía `next.config.ts` (script-src self + Clerk hosts).
- Rate limiting v1: el cron de Vercel respeta TTL del cache; v2 puede agregar Upstash Rate Limit en endpoints sensibles.

---

## 12. Estilo visual

### Paleta — "Bloomberg-style" (institucional, sobria)

#### Light mode

| Token                  | Hex                     |
| ---------------------- | ----------------------- |
| `--background`         | `#FAFAFA` (zinc-50)     |
| `--foreground`         | `#0A0A0A`               |
| `--card`               | `#FFFFFF`               |
| `--card-foreground`    | `#0A0A0A`               |
| `--primary`            | `#1E3A8A` (azul marino) |
| `--primary-foreground` | `#FFFFFF`               |
| `--muted`              | `#F4F4F5`               |
| `--muted-foreground`   | `#71717A`               |
| `--border`             | `#E4E4E7`               |
| `--input`              | `#E4E4E7`               |
| `--ring`               | `#1E3A8A`               |
| `--success` (gain)     | `#16A34A`               |
| `--destructive` (loss) | `#DC2626`               |

#### Dark mode

| Token                  | Hex                              |
| ---------------------- | -------------------------------- |
| `--background`         | `#09090B` (zinc-950)             |
| `--foreground`         | `#FAFAFA`                        |
| `--card`               | `#18181B`                        |
| `--card-foreground`    | `#FAFAFA`                        |
| `--primary`            | `#60A5FA` (azul claro accesible) |
| `--primary-foreground` | `#09090B`                        |
| `--muted`              | `#27272A`                        |
| `--muted-foreground`   | `#A1A1AA`                        |
| `--border`             | `#27272A`                        |
| `--input`              | `#27272A`                        |
| `--ring`               | `#60A5FA`                        |
| `--success` (gain)     | `#22C55E`                        |
| `--destructive` (loss) | `#EF4444`                        |

Implementado vía CSS variables en `globals.css`, switching con `next-themes`.

### Tipografía

- Sans: **Inter** (variable, vía `next/font/google`).
- Mono: **JetBrains Mono** para tickers, números financieros y código.
- Escala con clases Tailwind. Números financieros con `font-variant-numeric: tabular-nums` para alineación vertical.

### Iconografía

- **Lucide** (default de shadcn) para iconos de UI generales.
- **React Icons** disponible para casos donde necesites packs específicos (Font Awesome, Material, etc.).
- **Cero emojis** en código, comentarios y commits.

### Densidad

Configurable en `UserPreferences.tableDensity`. Aplica a tablas y listas mediante data attribute en el root y selectores CSS.

---

## 13. Estilo de código y convenciones

### TypeScript

- `tsconfig.json`:
  - `strict: true`
  - `noUncheckedIndexedAccess: true`
  - `noImplicitOverride: true`
  - `exactOptionalPropertyTypes: true`
- Cero `any`. Usar `unknown` + narrow.
- Imports absolutos vía path alias `@/*`.

### Comentarios

- **TSDoc en cada export público** (función, tipo, componente, hook):
  ```ts
  /**
   * Calcula el P&L sin realizar de una posición a precio actual.
   * @param holding - posición a evaluar
   * @param currentPriceMxn - último precio conocido en MXN
   * @returns P&L en MXN; positivo = ganancia, negativo = pérdida
   */
  ```
- **Comentarios inline del "porqué"** cuando la razón no es obvia leyendo el código:
  ```ts
  // Yahoo regresa precios SIC en USD; convertimos a MXN al spot del día porque
  // el usuario opera en pesos y la UI siempre muestra MXN salvo que displayCurrency='USD'.
  ```
- **Explicaciones de conceptos de finanzas** la primera vez que aparece un concepto en el archivo:
  ```ts
  // RSI > 70 = sobrecomprado; < 30 = sobrevendido (Wilder, 1978).
  ```
- **Headers de sección** en archivos largos:
  ```ts
  // ─── Validation ──────────────────────────
  ```
- **No** comentarios que describan QUÉ hace el código — eso lo dicen los nombres bien escogidos.
- Nombres de identificadores en inglés; comentarios en español.

### Naming

- Tipos y componentes: `PascalCase`.
- Funciones, variables, props: `camelCase`.
- Constantes globales: `SCREAMING_SNAKE_CASE`.
- Archivos de componentes: `ComponentName.tsx`. Otros archivos: `kebab-case.ts` salvo donde la convención del componente exige `ComponentName.logic.ts`.
- Booleanos: prefijo `is/has/should/can` (`isLoading`, `hasPosition`).
- Funciones que retornan promesas: forma verbal (`fetchQuote`, `executeTrade`).

### Código limpio

- Funciones puras donde se pueda; side effects aislados en `infrastructure`.
- Early return en lugar de nesting profundo.
- `const` por default; `let` solo cuando hay reasignación intencional.
- Sin `default exports` salvo donde Next.js lo exige (page.tsx, layout.tsx).
- Una unidad clara por archivo.

### ESLint + Prettier

- `eslint-config-next` + `plugin:import/recommended` + `eslint-plugin-tsdoc`.
- `import/no-restricted-paths` para enforcer las reglas de capas de clean architecture.
- Prettier con: `printWidth: 100`, `singleQuote: false`, `trailingComma: 'all'`, `semi: true`.

### Testing

- **Vitest** + **@testing-library/react** + **jsdom**.
- Tests unitarios en archivo hermano (`foo.test.ts` junto a `foo.ts`).
- `domain` y `application` con cobertura ≥90%.
- `infrastructure` con tests de contrato (mocks de DB con `pg-mem` o tests de integración con Neon test branch).
- Componentes presentacionales con tests visuales mínimos (renderiza sin crash + smoke de variantes principales).

### Git y commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Branches: `feature/<slug>`, `fix/<slug>`.
- PRs requieren CI verde (lint + typecheck + tests + drizzle migrate dry-run).

---

## 14. Limitaciones técnicas y disclaimer legal

### Limitaciones técnicas (visibles en UI)

1. **Datos con retraso** — Yahoo Finance free da BMV con ~15-20 min de retraso, SIC con 5-15 min. La UI muestra timestamp del último dato y un badge "Datos retrasados ~15 min" cuando aplica.
2. **No hay sync con GBM+** — los trades se registran manualmente.
3. **Cobertura puede tener huecos** — emisoras pequeñas o ilíquidas pueden tener datos incompletos. La UI muestra "Datos no disponibles" en lugar de números falsos.
4. **No es tiempo real** — no apto para day trading que requiera datos al segundo.

### Disclaimer legal

> Este sistema es una **herramienta educativa y de gestión personal**. No constituye asesoría financiera, recomendación de inversión, ni intermediación bursátil. Las decisiones de inversión son responsabilidad exclusiva del usuario. Los datos de mercado provienen de fuentes públicas y pueden tener retraso o errores. El simulador de paper trading es una práctica con dinero ficticio y los resultados no representan ni garantizan resultados futuros con dinero real. Para asesoría profesional consulta a un asesor financiero certificado o a tu intermediario bursátil (en este caso, GBM México).

Aparece en:

- Footer permanente en toda página autenticada.
- Sección dedicada en la landing pública antes del CTA.
- README del proyecto.
- Modal bloqueante al primer login (con checkbox "Entiendo y acepto" → `disclaimerAcceptedAt`).

---

## 15. Setup local y deployment

### Setup local

```bash
# 1. Clone y dependencias
git clone <repo>
cd bmv-stock
pnpm install

# 2. Variables de entorno
cp .env.example .env.local
# Llenar:
#   DATABASE_URL                  ← Neon (o Postgres local)
#   DATABASE_URL_UNPOOLED
#   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
#   CLERK_SECRET_KEY
#   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
#   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# 3. Migrations
pnpm drizzle-kit migrate

# 4. Dev server
pnpm dev
# Open http://localhost:3000
```

### Deployment a Vercel

1. Conectar repo de GitHub en dashboard de Vercel.
2. Set environment variables en Vercel (Production + Preview).
3. Crear cron en `vercel.json`:
   ```json
   {
     "crons": [{ "path": "/api/cron/precache-watchlist", "schedule": "0 23 * * *" }]
   }
   ```
4. `git push origin main` → deploy automático.

---

## 16. Roadmap

### v1 (este diseño)

- [x] Stack y arquitectura
- [ ] Setup repo + tooling
- [ ] DB schema + migraciones
- [ ] Auth con Clerk + allowlist
- [ ] Yahoo provider + cache
- [ ] CRUD de Holdings y Trades reales
- [ ] Paper portfolio + paper trades
- [ ] Watchlist (sin alertas activas)
- [ ] Pantalla de análisis con indicadores y tooltips educativos
- [ ] Core allocation calculator
- [ ] Settings
- [ ] Landing pública
- [ ] Disclaimer modal
- [ ] Theming light/dark con paleta Bloomberg-style
- [ ] Tests con cobertura ≥90% en domain + application
- [ ] README

### v2 (post-launch, no en este spec)

- Alertas activas (email, posiblemente Telegram).
- Backtesting de estrategias.
- Screener sobre todo el universo BMV/SIC.
- Cálculo de ISR mexicano.
- Múltiples portafolios paper.
- Dividendos automáticos (calendario).
- Exportación a CSV/PDF.
- Comparación contra benchmarks múltiples (S&P, IPC, MSCI EM, etc.).
- Métricas avanzadas: Sharpe, drawdown, beta vs IPC.

### v3+ (especulativo)

- Cripto y forex.
- Bot de Telegram para alertas y consultas rápidas.
- Sentry / Axiom para observabilidad.
- Multi-usuario (si alguna vez se abre).

---

## 17. Apéndice — Conceptos educativos a documentar (`lib/concepts/`)

Cada concepto vive como un módulo TS con `slug`, `title`, `shortExplanation` (para tooltip) y `longExplanation` (markdown para drawer). Lista mínima v1:

- `pe-ratio` (P/E)
- `peg-ratio` (PEG)
- `eps`
- `dividend-yield`
- `payout-ratio`
- `market-cap`
- `book-value`
- `pb-ratio`
- `roe`
- `debt-to-equity`
- `rsi`
- `macd`
- `sma`
- `ema`
- `bollinger-bands`
- `volume`
- `volatility`
- `beta`
- `support-resistance`
- `dollar-cost-averaging`
- `core-satellite`
- `etf`
- `index-fund`
- `sic-mexico`
- `naftrac`

---

## 18. Decisiones abiertas / a confirmar en implementación

- Nombre final del proyecto (provisional: `bmv-stock`).
- Logo / branding (placeholder cuadrado de color primario en mockups).
- Lista exacta de ETFs sugeridos por riskProfile en core-allocation (requiere investigación de productos disponibles vía SIC en GBM+).
- Si shadcn `useToast` cubre todas las necesidades o requerimos un `ToastContext` propio.
