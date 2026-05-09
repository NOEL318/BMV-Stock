# Handoff: Finalizar BMV Stock v1 — pegar API keys y validar smoke tests

> **Para una nueva conversación sin contexto previo.** Este documento contiene todo lo que necesitas para retomar el proyecto donde se quedó.
>
> **Actualizado 2026-05-08.** **Los 5 planes ya están ejecutados en código.** v1 completa: 28 rutas (15 páginas + 13 endpoints), 152 tests passing, paleta Bloomberg light/dark con cookies, Clerk auth, Drizzle + Neon, Yahoo Finance integration, dashboard real, watchlist, análisis con gráficas, portfolio + paper trading, settings, core allocation, landing pública, disclaimer modal, cron de pre-cache configurado, middleware migrado a `proxy.ts`, `react-patch` eliminado vía `.npmrc` fix.
>
> **Lo único pendiente** es pegar las API keys reales y validar end-to-end. Los pasos 1-6 abajo cubren toda la validación.

---

## Contexto del proyecto

**Repo:** `/Users/noel/REPOS/BMV-Stock`

**Qué es:** Aplicación web personal para análisis, paper trading y gestión de portafolio en GBM México. Single-user (allowlist por email). Stack: Next.js 16 + TS strict + Tailwind 4 + shadcn + Clerk + Drizzle + Neon. Clean architecture en cuatro capas (`domain`, `application`, `infrastructure`, presentación en `app/` y `components/`).

**Documentos clave** (léelos en orden si necesitas contexto):

1. `docs/superpowers/specs/2026-05-06-bmv-stock-design.md` — spec v1 completo aprobado.
2. `docs/superpowers/plans/2026-05-06-plan-1-foundation.md` — plan 1 (este).
3. `README.md` — resumen del repo y comandos.
4. `AGENTS.md` y `CLAUDE.md` — advertencia: Next.js 16 tiene breaking changes vs entrenamiento, consultar `node_modules/next/dist/docs/01-app/` antes de tocar layouts/server components.

**Dos preferencias del usuario** que aplican siempre:

- **Nunca correr `git commit` o `git add` automáticamente.** El usuario commitea manualmente. Solo escribir/modificar archivos.
- **Sin emojis** en código, comentarios, commits ni output. Comentarios en español con acentos correctos. Identificadores en inglés.

---

## Estado actual (2026-05-06, fin de sesión previa)

Plan 1 ejecutado en 4 batches con subagents. Pasaron `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` (4 tests). Faltan **3 sub-steps que requieren credenciales reales** y la **validación final**.

### Lo que está construido

```
bmv-stock/
├── docs/superpowers/{specs,plans,handoff}/
├── drizzle/0000_*.sql                ← migración generada, NO aplicada aún
├── src/
│   ├── app/
│   │   ├── (app)/{layout,dashboard/page}.tsx
│   │   ├── (public)/{layout,page}.tsx
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   ├── globals.css                ← paleta Bloomberg light/dark con HSL
│   │   ├── layout.tsx                 ← Inter + JetBrains Mono + Providers
│   │   └── providers.tsx              ← Clerk + Theme + Query + Toaster
│   ├── components/
│   │   ├── ui/                        ← 11 primitivas shadcn
│   │   └── layout/
│   │       ├── Sidebar/{Sidebar,AppSidebar}.tsx + .types/.styles/index/.test
│   │       └── TopNav/                ← .tsx/.types/.styles/index
│   ├── infrastructure/
│   │   ├── auth/clerk.ts              ← requireUserId, getCurrentClerkUser
│   │   └── db/{client,schema}.ts      ← Drizzle + tabla users
│   ├── env.ts                         ← validación Zod
│   └── __tests__/{setup,sanity.test}.ts
├── middleware.ts                      ← Clerk middleware
├── .env.local                         ← TIENE PLACEHOLDERS, hay que reemplazar
├── components.json, drizzle.config.ts, vitest.config.ts
├── eslint.config.mjs, .prettierrc
└── README.md
```

### Desviaciones del spec aplicadas (todas válidas, anotadas para que no las "corrijas")

| #   | Desviación                                                        | Razón                                                                                                                                            |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Next.js 16 en vez de 15                                           | `create-next-app@latest` instaló 16. `next lint` removido — `lint` script usa `eslint .`                                                         |
| 2   | Tailwind 4 CSS-first (sin `tailwind.config.ts`)                   | v4 usa `@theme inline` en CSS. Tokens Bloomberg en `:root`/`.dark` blocks                                                                        |
| 3   | Clerk 7: sin `UserButton.afterSignOutUrl`                         | API removida. Redirect post-signout se configura en `ClerkProvider`                                                                              |
| 4   | shadcn Button con `render` prop, no `asChild`                     | Nuevo shadcn usa `@base-ui/react`                                                                                                                |
| 5   | `AppSidebar.tsx` extra (Client Component wrapper)                 | Next.js 16 no permite pasar funciones (icon components) de Server a Client Components. Layout pasa los items a `AppSidebar`, que vive en cliente |
| 6   | react-icons v5: `LuHome` → `LuHouse`                              | Renombrado en v5                                                                                                                                 |
| 7   | `vitest.config.ts` con `stripUseClientPlugin` + alias `next/link` | React 19 concurrent + Next.js 16 module resolution requieren stubs en tests                                                                      |
| 8   | drizzle-kit invocado vía `./node_modules/.bin/drizzle-kit`        | `pnpm dlx` baja versión más nueva incompatible con drizzle-orm instalada. `pnpm db:generate` (script) usa local                                  |

### Valores placeholder en `.env.local` (reemplazar)

```
DATABASE_URL=postgresql://placeholder:placeholder@ep-placeholder.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://placeholder:placeholder@ep-placeholder-unpooled.us-east-1.aws.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_PLACEHOLDER_REPLACE_BEFORE_RUNTIME_USE_AAAAAAAAAAAAAAAA
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
```

Las dos `DATABASE_URL` y las dos `CLERK_*` keys son las que el usuario tiene que reemplazar. Las cuatro `NEXT_PUBLIC_CLERK_*_URL` se quedan como están.

---

## Tarea pendiente: tu trabajo en esta nueva conversación

### Paso 0 — Verificar que el usuario te pasó las keys

El usuario debe haberte pegado en el mensaje (o en `.env.local` directamente):

- `DATABASE_URL` (Neon, pooled — el que termina en `-pooler`)
- `DATABASE_URL_UNPOOLED` (Neon, direct — el que NO termina en `-pooler`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (empieza con `pk_test_` o `pk_live_`)
- `CLERK_SECRET_KEY` (empieza con `sk_test_` o `sk_live_`)

Si te las pega en el mensaje, escríbelas a `/Users/noel/REPOS/BMV-Stock/.env.local` reemplazando las placeholder. Si te dice "ya las puse en `.env.local`", solo verifica con `grep -c "placeholder" /Users/noel/REPOS/BMV-Stock/.env.local` que regrese `0`.

Recuerda que `.env.local` está en `.gitignore` — nunca lo commitees ni lo expongas.

### Paso 1 — Aplicar migración a Neon (Task 7.6 del plan)

```bash
cd /Users/noel/REPOS/BMV-Stock
pnpm db:migrate
```

Resultado esperado: la migración `0000_*.sql` se aplica y crea la tabla `users` en Neon. Verifica con `pnpm db:studio` (abre UI en `https://local.drizzle.studio`) o vía dashboard de Neon.

Si truena con error de credenciales: el `DATABASE_URL_UNPOOLED` debe ser el connection string **directo** (no el pooled), porque drizzle-kit no soporta pooling para DDL.

### Paso 2 — Smoke test end-to-end (Task 10.13)

```bash
pnpm dev
```

Abrir `http://localhost:3000` en navegador y validar EN ORDEN:

1. **Landing pública** carga con título "BMV Stock", descripción y botón "Iniciar sesión".
2. Click "Iniciar sesión" → redirect a `/sign-in` con UI de Clerk.
3. Sign-in con el email autorizado en allowlist de Clerk → sin error.
4. Después del login → redirect a `/dashboard` → ver "Hola, [tu nombre/email]" + sidebar a la izquierda con 7 items + topnav arriba.
5. Click toggle de tema (luna/sol) en topnav → la app cambia entre light y dark con la paleta Bloomberg correcta (azul marino `#1E3A8A` en light, azul claro `#60A5FA` en dark).
6. Click avatar de Clerk → "Sign out" → regresa a landing.

Si falla **(3)** "sign-in" con un error tipo "User not allowed to sign up": el email NO está en el allowlist de Clerk. Pídele al usuario verificar en `https://dashboard.clerk.com/` → su app → "Restrictions" → "Allowlist" que tenga su email exacto.

Si falla **(4)** con error 401 o redirect loop: revisa que la cookie de Clerk se esté seteando — puede ser problema de `middleware.ts` config matcher. Lee `node_modules/next/dist/docs/01-app/03-routing/middleware.md` si dudas.

Detén el dev server con Ctrl+C cuando termines.

### Paso 3 — Validación final (Task 13 del plan)

Correr en orden, todos deben pasar:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Si alguno falla, diagnóstica y arregla antes de marcar Plan 1 como completo. Reporta al usuario.

### Paso 4 — Verificar `.env.local` no commiteado

```bash
git status
```

`.env.local` NO debe aparecer (lo cubre `.gitignore`). Si aparece, el `.gitignore` está mal — investiga (no debería pasar; el ignore line `.env*.local` lo cubre).

---

## Plan 2 — pendiente de validación con keys

Plan 2 (Domain + Yahoo) ya está ejecutado en código. La spec está en `docs/superpowers/plans/2026-05-07-plan-2-domain-yahoo.md`. Resumen de lo construido:

- Capa de dominio completa: 4 value objects (`Money`, `Ticker`, `Percentage`, plus implícito `Currency`/`Exchange` types), 9 entities (Trade, Holding con `applyTradeToHolding`/`createHoldingFromBuy`, PaperTrade, PaperPosition, PaperPortfolio con `applyPaperBuy`/`applyPaperSell`, WatchlistItem, UserPreferences, Quote, HistoricalPrice), 7 errors, 9 ports.
- Schema Drizzle completo: 8 enums + 10 tablas. Migración `drizzle/0001_*.sql` generada (NO aplicada).
- 8 repositories Drizzle en `src/infrastructure/db/repositories/`.
- `YahooMarketDataProvider` (yahoo-finance2 v3 — usa `new YahooFinance()` por cambio de API) y `CachedMarketDataProvider` (decorator con TTL 10min).
- 3 use cases: `getQuote`, `getMarketSnapshot`, `getHistoricalPrices` (en `src/application/quotes/`).
- Composition root: `src/application/di.ts` con `getDeps()` singleton.
- Endpoint `GET /api/quotes?ticker=...` en `src/app/api/quotes/route.ts`.
- ESLint rule `import/no-restricted-paths` activa para enforcer capas.
- 71 tests passing. Cobertura: 99.1% statements / 98.21% branches en domain + application.

### Desviaciones adicionales del Plan 2 (todas razonables, no las "corrijas")

| #   | Desviación                                                                    | Razón                                                                                    |
| --- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 9   | `yahoo-finance2` v3 usa `new YahooFinance()` (clase) en vez de export default | API change v2→v3                                                                         |
| 10  | `DrizzlePaperPortfolioRepository.reset()` sin transacción                     | `neon-http` driver no soporta transacciones interactivas. Hace DELETE+UPDATE secuencial. |
| 11  | `di.ts` usa `eslint-disable import/no-restricted-paths` en vez de `except`    | El plugin no soporta target-file exemption por `except`                                  |
| 12  | Excepciones de la lint rule en zona `src/app` corregidas a paths relativos    | Eran absolutos (`./src/infrastructure/auth/clerk.ts`) y no resolvían bien                |
| 13  | `vitest.config.ts` excluye `src/application/di.ts` de coverage                | Composition root, no testeable sin DB real                                               |
| 14  | `@vitest/coverage-v8` agregado como devDep                                    | Necesario para `pnpm test --coverage`                                                    |

### Paso 5 — Aplicar migración 0001 a Neon (Plan 2)

Después de Paso 1 (que aplica 0000 con `users`), aplicar 0001 con todas las demás tablas:

```bash
cd /Users/noel/REPOS/BMV-Stock
pnpm db:migrate
```

`drizzle-kit migrate` aplica todas las migraciones pendientes en orden. Si Paso 1 ya corrió antes y no había keys, este comando aplicará 0000 + 0001 en una sola pasada.

Verificar en Neon dashboard o `pnpm db:studio` que existen TODAS las tablas:

- users (Plan 1)
- holdings, trades
- paper_portfolios, paper_positions, paper_trades
- watchlist_items
- user_preferences
- quote_cache, historical_price

Y los 8 enums: `exchange`, `trade_action`, `paper_trade_action`, `currency`, `theme`, `table_density`, `risk_profile`, `timeframe`.

### Paso 6 — Smoke test del endpoint `/api/quotes`

Solo posible cuando hay sesión real de Clerk + DB con tablas:

```bash
pnpm dev
```

1. En navegador, login en `http://localhost:3000` (re-usar la sesión del Paso 2 si aún sirve).
2. Sin cerrar el dev server, en otra terminal:

```bash
# Obtener la cookie __session de DevTools (Application → Cookies → localhost:3000)
curl -i 'http://localhost:3000/api/quotes?ticker=WALMEX.MX' \
  -H "Cookie: __session=<paste tu Clerk session cookie aquí>"
```

Resultado esperado: `200 OK` con JSON tipo:

```json
{
  "ticker": "WALMEX",
  "exchange": "BMV",
  "priceMxn": 69.42,
  "priceUsd": null,
  "openMxn": 68.5,
  "highMxn": 70.1,
  "lowMxn": 67.8,
  "volume": 1234567,
  "asOf": "2026-05-07T16:00:00.000Z"
}
```

**Diagnóstico de errores:**

- `401 unauthorized` → cookie de Clerk inválida o expirada. Re-login en navegador y copiar cookie nuevamente.
- `400 invalid query` → falta el query param `ticker`.
- `400 + code: INVALID_TICKER` → formato del ticker mal (ej. `WAL!MEX`). Probar con `WALMEX.MX`, `AAPL`, `SPY`.
- `404 + code: TICKER_NOT_FOUND` → Yahoo no conoce ese ticker. Probar con uno conocido (`WALMEX.MX`).
- `503 + code: MARKET_DATA_UNAVAILABLE` → Yahoo está caído o rate-limited. Re-intentar en 1 min.
- `500 internal server error` → revisar logs del dev server. Si menciona "relation X does not exist", la migración 0001 NO se aplicó — repetir Paso 5.

Probar también `?ticker=AAPL` (SIC) para validar la conversión USD→MXN. El JSON debe tener `priceUsd` no-null y `priceMxn = priceUsd * usdmxn_rate`.

### Después de Plan 1 + Plan 2: siguiente paso

Cuando los 6 pasos pasen, **ambos planes quedan 100% completados**. Reporta al usuario:

> Plan 1 + Plan 2 completos. Foundation desplegable + capa de dominio cerrada + Yahoo provider + endpoint `/api/quotes` operativo. 71 tests con 99% coverage en domain/application.
>
> Listo para Plan 3: Portafolio Real + Paper Trading (use cases de trades, formularios con react-hook-form + Zod, páginas `/portfolio` y `/paper-trading`, componentes financieros como MetricCard/MoneyDisplay/TickerBadge/PnLBadge).

Y pregúntale si quieres escribir el Plan 3.

**Para escribir Plan 3:** invoca `superpowers:writing-plans`. Sigue el patrón de Plan 1 y Plan 2 (tasks bite-sized, código completo, sin commits automáticos). Ya hay 2 planes ejecutados como referencia.

---

## Información operacional rápida

**Para correr cualquier comando:** `cd /Users/noel/REPOS/BMV-Stock && <comando>`.

**Si pnpm no está en PATH:** ya hay un wrapper en `~/.local/bin/pnpm` que invoca via corepack. Si truena, invocar directo: `corepack pnpm <args>`.

**Memory file relevante:** `/Users/noel/.claude/projects/-Users-noel-REPOS/memory/feedback_no_git_commits.md` — instrucción de no commitear automáticamente.

**Idioma del usuario:** español. Responder en español. Identificadores de código en inglés, comentarios y strings de UI en español con acentos correctos.

**Estilo de respuestas:** corto, directo, sin floritura. Mostrar comandos exactos. No explicar qué se hizo si ya se hizo.
