# BMV Stock

Aplicacion web personal de analisis, paper trading y gestion de portafolio para inversionistas individuales en GBM Mexico.

> **Disclaimer.** Este sistema es una herramienta educativa y de gestion personal. No constituye asesoria financiera, recomendacion de inversion, ni intermediacion bursatil. Las decisiones son responsabilidad exclusiva del usuario. Para asesoria profesional consulta a un asesor financiero certificado o a GBM Mexico.

## Capabilities

- Dashboard con market snapshot (IPC, USD/MXN, S&P 500, NASDAQ).
- Watchlist de emisoras seguidas con cotizacion en casi tiempo real.
- Analisis individual de ticker: grafica de velas con SMA20/SMA50, indicadores (RSI, MACD), metricas educativas.
- Portafolio real: registra trades de GBM+, calcula P&L sin realizar y comparativa vs IPC.
- Paper trading con $100,000 MXN ficticios para practicar.
- Calculadora de nucleo aburrido (asignacion recomendada en ETFs segun perfil de riesgo).
- Theme light/dark con paleta Bloomberg-style, persistido en cookie.

## Stack

- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS 4 + shadcn/ui (base-ui) + React Icons
- TanStack Query + react-hook-form + Zod
- Drizzle ORM + Neon Postgres
- Clerk (auth con allowlist single-user)
- Lightweight Charts (TradingView)
- Vitest + Testing Library

## Setup local

### Pre-requisitos

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- Cuenta gratuita en [Neon](https://neon.tech) — copiar `DATABASE_URL` y `DATABASE_URL_UNPOOLED`
- Cuenta gratuita en [Clerk](https://clerk.com) — agregar tu email al allowlist; copiar `Publishable key` y `Secret key`

### Instalar y correr

```bash
pnpm install
cp .env.example .env.local
# Editar .env.local con DATABASE_URL, CLERK_*, etc.
pnpm db:migrate
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

- `pnpm dev` — servidor de desarrollo
- `pnpm build` — build de produccion
- `pnpm test` — tests con Vitest
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript
- `pnpm format` — Prettier (escribir)
- `pnpm db:generate` — generar migracion Drizzle desde schema
- `pnpm db:migrate` — aplicar migraciones
- `pnpm db:studio` — UI para explorar la DB

## Arquitectura

Clean architecture en cuatro capas:

```
src/
+-- app/             <- Presentation (Next.js routes, layouts, API handlers)
+-- domain/          <- Entities, value objects, errors, ports (sin deps externas)
+-- application/     <- Use cases (orquestan domain via ports)
+-- infrastructure/  <- Adaptadores (Drizzle, Yahoo, Clerk)
+-- components/      <- UI reusable (cada componente en su folder)
+-- hooks/           <- Hooks de TanStack Query
+-- contexts/        <- React Contexts (theme)
+-- lib/             <- Utils, schemas Zod, conceptos educativos
```

ESLint enforza las reglas de capas (`import/no-restricted-paths`):

- `domain` no importa de fuera.
- `application` solo importa `domain` (excepto `di.ts` que es la composition root).
- `app` y `components` consumen `application` via hooks/calls; nunca `infrastructure` directo.

## Convenciones de codigo

- Cero emojis en codigo, comentarios o commits.
- TSDoc en cada export publico.
- Comentarios en espanol con acentos correctos.
- Identificadores en ingles.
- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`).
- Naming: `PascalCase` para tipos/componentes, `camelCase` para funciones/variables, `SCREAMING_SNAKE_CASE` para constantes globales.

## Deploy a Vercel

1. Conectar repo de GitHub en Vercel.
2. Configurar variables de entorno (Production + Preview): `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CRON_SECRET`.
3. `git push origin main` -> deploy automatico.
4. El cron de pre-cache (definido en `vercel.json`) corre diariamente.

## Roadmap

### v1 (entregado)

- Plan 1: Foundation
- Plan 2: Domain + Yahoo
- Plan 3: Portafolio Real + Paper Trading
- Plan 4: Watchlist + Analisis + Dashboard
- Plan 5: Landing + Settings + Polish

### v2 (futuro)

- Alertas activas (email + Telegram).
- Backtesting de estrategias.
- Screener sobre todo el universo BMV.
- Calculo de ISR mexicano.
- Multiples portafolios paper.
- Metricas avanzadas (Sharpe, drawdown, beta vs IPC).
- Sentry/Axiom para observabilidad.

## Documentacion

- Spec: [`docs/superpowers/specs/2026-05-06-bmv-stock-design.md`](docs/superpowers/specs/2026-05-06-bmv-stock-design.md)
- Planes de implementacion: [`docs/superpowers/plans/`](docs/superpowers/plans/)
- Notas de finalizacion con API keys: [`docs/superpowers/handoff/`](docs/superpowers/handoff/)

## Licencia

Personal. No para distribucion publica.
