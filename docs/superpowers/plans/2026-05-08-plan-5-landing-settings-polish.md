# BMV Stock · Plan 5 · Landing + Settings + Polish

> **Preferencias del usuario:** Sin `git commit` automático. Sin emojis. TSDoc en cada export. Comentarios en español con acentos. Identificadores en inglés. Strict TS.

> **Pre-condición:** Plans 1-4 ejecutados. App funcional con dashboard real, watchlist, análisis, portfolio, paper trading. 144 tests passing.

**Goal:** Cerrar v1 con polish. Landing pública completa con disclaimer prominente, modal de aceptación al primer login, página de Settings real, calculadora de Core Allocation, cron de Vercel para pre-cache, README final, y migración a `proxy.ts` (Next.js 16).

**Architecture:** Mismo patrón clean architecture. Use cases pequeños donde aplique. Componentes en folders propios.

---

## File structure

```
src/
├── application/
│   ├── core-allocation/
│   │   └── recommendAllocation.ts (+ .test.ts)
│   └── user-preferences/
│       ├── getOrCreateUserPreferences.ts (+ .test.ts)
│       └── updateUserPreferences.ts (+ .test.ts)
├── lib/schemas/
│   └── userPreferences.ts
├── components/
│   ├── landing/
│   │   ├── Hero/
│   │   ├── FeatureGrid/
│   │   ├── HowItWorks/
│   │   ├── Disclaimer/
│   │   └── LandingFooter/
│   └── DisclaimerModal/
└── app/
    ├── api/
    │   ├── user-preferences/route.ts          ← GET + PUT
    │   ├── core-allocation/route.ts           ← POST con riskProfile
    │   └── cron/precache/route.ts             ← cron handler
    └── (app)/
        ├── settings/page.tsx                   ← reemplaza placeholder
        └── core-allocation/page.tsx            ← reemplaza placeholder

vercel.json                                      ← cron config
proxy.ts                                         ← reemplaza middleware.ts
README.md                                        ← reescribir
```

---

## Task 1: User Preferences use cases (TDD)

**Files:**

- Create: `src/application/user-preferences/getOrCreateUserPreferences.ts` + `.test.ts`
- Create: `src/application/user-preferences/updateUserPreferences.ts` + `.test.ts`
- Create: `src/lib/schemas/userPreferences.ts`

### Schema

`src/lib/schemas/userPreferences.ts`:

```ts
import { z } from "zod";

/**
 * Schema de body para PUT /api/user-preferences. Todos los campos opcionales:
 * solo se actualizan los provistos.
 */
export const updateUserPreferencesSchema = z.object({
  displayCurrency: z.enum(["MXN", "USD"]).optional(),
  defaultTimeframe: z.enum(["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  tableDensity: z.enum(["compact", "comfortable"]).optional(),
  riskProfile: z.enum(["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]).optional(),
  disclaimerAcceptedAt: z.coerce.date().nullable().optional(),
});

export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;
```

### getOrCreateUserPreferences

```ts
// src/application/user-preferences/getOrCreateUserPreferences.ts
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from "@/domain/entities/UserPreferences";
import type { UserPreferencesRepository } from "@/domain/ports/UserPreferencesRepository";

/**
 * Obtiene las preferencias del usuario. Si no existen aún, las crea con
 * los valores default. Idempotente.
 */
export async function getOrCreateUserPreferences({
  userId,
  repo,
}: {
  userId: string;
  repo: UserPreferencesRepository;
}): Promise<UserPreferences> {
  const existing = await repo.findByUser(userId);
  if (existing) return existing;
  return repo.upsert({ userId, ...DEFAULT_USER_PREFERENCES });
}
```

Test (2): regresa existing si ya existe; crea con defaults si no.

### updateUserPreferences

```ts
// src/application/user-preferences/updateUserPreferences.ts
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from "@/domain/entities/UserPreferences";
import type { UserPreferencesRepository } from "@/domain/ports/UserPreferencesRepository";

import type { UpdateUserPreferencesInput } from "@/lib/schemas/userPreferences";

/**
 * Actualiza las preferencias del usuario aplicando un patch parcial.
 * Si no existen, crea con defaults + el patch.
 */
export async function updateUserPreferences({
  userId,
  patch,
  repo,
}: {
  userId: string;
  patch: UpdateUserPreferencesInput;
  repo: UserPreferencesRepository;
}): Promise<UserPreferences> {
  const existing = await repo.findByUser(userId);
  const base: UserPreferences = existing ?? { userId, ...DEFAULT_USER_PREFERENCES };
  const next: UserPreferences = {
    ...base,
    ...patch,
    userId,
  } as UserPreferences;
  return repo.upsert(next);
}
```

Test (2): patch sobre existing, crea con defaults+patch si no existe.

**Checkpoint Task 1.**

---

## Task 2: API routes — user-preferences + core-allocation + cron

### `/api/user-preferences` (GET + PUT)

`src/app/api/user-preferences/route.ts`:

```ts
import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { getOrCreateUserPreferences } from "@/application/user-preferences/getOrCreateUserPreferences";
import { updateUserPreferences } from "@/application/user-preferences/updateUserPreferences";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { updateUserPreferencesSchema } from "@/lib/schemas/userPreferences";

export async function GET() {
  try {
    const userId = await requireUserId();
    const { userPreferences } = getDeps();
    const prefs = await getOrCreateUserPreferences({ userId, repo: userPreferences });
    return NextResponse.json({ preferences: prefs });
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("/api/user-preferences GET error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = updateUserPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { userPreferences } = getDeps();
    const prefs = await updateUserPreferences({
      userId,
      patch: parsed.data,
      repo: userPreferences,
    });
    return NextResponse.json({ preferences: prefs });
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("/api/user-preferences PUT error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
```

### `/api/core-allocation` POST

Crear `src/application/core-allocation/recommendAllocation.ts`:

```ts
import type { RiskProfile } from "@/domain/entities/UserPreferences";

/**
 * Una recomendación de asignación: par (categoría, porcentaje, ETFs sugeridos).
 */
export interface AllocationBucket {
  category: "BMV-EQUITY" | "INTL-EQUITY" | "BONDS" | "CASH";
  label: string;
  percent: number;
  suggestedTickers: string[];
  rationale: string;
}

/**
 * Tabla estática que mapea perfil de riesgo a porcentajes de cada categoría.
 * Estos valores son guías generales — la spec señala que la lista exacta
 * de ETFs disponibles vía SIC en GBM+ se confirma en producción.
 */
const ALLOCATIONS: Record<RiskProfile, AllocationBucket[]> = {
  CONSERVATIVE: [
    {
      category: "BMV-EQUITY",
      label: "Renta variable mexicana",
      percent: 20,
      suggestedTickers: ["NAFTRAC.MX"],
      rationale: "Núcleo en el IPC vía NAFTRAC.",
    },
    {
      category: "INTL-EQUITY",
      label: "Renta variable internacional",
      percent: 30,
      suggestedTickers: ["VOO", "VTI"],
      rationale: "Diversificación amplia en EUA con TER bajo.",
    },
    {
      category: "BONDS",
      label: "Renta fija",
      percent: 40,
      suggestedTickers: ["BND", "AGG"],
      rationale: "Estabilidad y descorrelación en mercados bajistas.",
    },
    {
      category: "CASH",
      label: "Liquidez",
      percent: 10,
      suggestedTickers: [],
      rationale: "Reserva para oportunidades y emergencias.",
    },
  ],
  MODERATE: [
    {
      category: "BMV-EQUITY",
      label: "Renta variable mexicana",
      percent: 25,
      suggestedTickers: ["NAFTRAC.MX"],
      rationale: "Núcleo en el IPC.",
    },
    {
      category: "INTL-EQUITY",
      label: "Renta variable internacional",
      percent: 50,
      suggestedTickers: ["VOO", "VTI", "VXUS"],
      rationale: "Mayor exposición global, balance EUA + ex-EUA.",
    },
    {
      category: "BONDS",
      label: "Renta fija",
      percent: 20,
      suggestedTickers: ["BND"],
      rationale: "Amortigua la volatilidad.",
    },
    {
      category: "CASH",
      label: "Liquidez",
      percent: 5,
      suggestedTickers: [],
      rationale: "Pequeña reserva táctica.",
    },
  ],
  AGGRESSIVE: [
    {
      category: "BMV-EQUITY",
      label: "Renta variable mexicana",
      percent: 25,
      suggestedTickers: ["NAFTRAC.MX"],
      rationale: "Núcleo mexicano para reducir riesgo cambiario.",
    },
    {
      category: "INTL-EQUITY",
      label: "Renta variable internacional",
      percent: 65,
      suggestedTickers: ["VOO", "QQQ", "VTI", "VXUS"],
      rationale: "Mayor peso en equity con tilt hacia tecnología.",
    },
    {
      category: "BONDS",
      label: "Renta fija",
      percent: 5,
      suggestedTickers: ["BND"],
      rationale: "Pequeña posición defensiva.",
    },
    {
      category: "CASH",
      label: "Liquidez",
      percent: 5,
      suggestedTickers: [],
      rationale: "Mínimo operativo.",
    },
  ],
};

/**
 * Recomienda una asignación de núcleo para un perfil de riesgo dado.
 * La asignación es una guía general — el usuario debe consultar a un asesor
 * antes de operar. La suma de porcentajes siempre es 100.
 */
export function recommendAllocation(profile: RiskProfile): AllocationBucket[] {
  return ALLOCATIONS[profile];
}
```

Test (4): cada profile suma 100, regresa los buckets correctos por profile.

`src/app/api/core-allocation/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { recommendAllocation } from "@/application/core-allocation/recommendAllocation";
import { requireUserId } from "@/infrastructure/auth/clerk";

const bodySchema = z.object({
  riskProfile: z.enum(["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]),
});

export async function POST(req: Request) {
  try {
    await requireUserId();
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const allocation = recommendAllocation(parsed.data.riskProfile);
    return NextResponse.json({ allocation });
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("/api/core-allocation error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
```

### `/api/cron/precache` GET

Endpoint que Vercel cron va a invocar diariamente para pre-cachear precios de watchlist + holdings + benchmarks.

Crear `src/app/api/cron/precache/route.ts`:

```ts
import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { Ticker } from "@/domain/value-objects/Ticker";

/**
 * GET /api/cron/precache
 *
 * Endpoint invocado por el cron de Vercel cada noche (23:00 CDMX).
 * Pre-cachea las cotizaciones de:
 * - benchmarks (IPC, USDMXN, SPX, IXIC)
 * - todos los tickers únicos en watchlist + holdings de todos los usuarios
 *
 * Nota: en single-user este "todos los usuarios" es solo uno. La estructura
 * permite extender a multi-user sin refactor.
 *
 * Auth: requiere header `Authorization: Bearer <CRON_SECRET>` que Vercel
 * configura automáticamente en cron requests.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (process.env.CRON_SECRET && auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { holdings, watchlist, marketData } = getDeps();

  const errors: string[] = [];
  let succeeded = 0;

  // 1. Pre-cachear el market snapshot (IPC, USDMXN, SPX, IXIC).
  try {
    await marketData.getMarketSnapshot();
    succeeded += 4;
  } catch (e) {
    errors.push(`snapshot: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Recolectar tickers únicos de holdings + watchlist.
  // Como es single-user, no iteramos por usuarios; tomamos todo desde la DB.
  // Para multi-user esto se generalizaría con un query de "todos los tickers únicos".
  const allHoldings = await collectAllHoldings(holdings);
  const allWatchlist = await collectAllWatchlist(watchlist);
  const tickers = new Set<string>();
  for (const h of allHoldings) {
    tickers.add(h.exchange === "BMV" ? `${h.ticker}.MX` : h.ticker);
  }
  for (const w of allWatchlist) {
    tickers.add(w.exchange === "BMV" ? `${w.ticker}.MX` : w.ticker);
  }

  // 3. Pre-cachear cada ticker.
  for (const raw of tickers) {
    try {
      await marketData.getQuote(Ticker.parse(raw));
      succeeded += 1;
    } catch (e) {
      errors.push(`${raw}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ succeeded, errors });
}

async function collectAllHoldings(repo: ReturnType<typeof getDeps>["holdings"]) {
  // En single-user no tenemos un método "list all" — usamos el listByUser
  // del único usuario autorizado. Si Plan 1 grabó el userId del propietario
  // en el seed, leerlo aquí; si no, este cron no opera en single-user mode.
  // Para v1 simplemente regresamos array vacío si no hay manera de listar.
  return [];
}

async function collectAllWatchlist(repo: ReturnType<typeof getDeps>["watchlist"]) {
  return [];
}
```

**Nota crítica:** este cron es esqueleto en v1. Para que funcione en single-user real, hay que:

1. Saber el `userId` del usuario propietario (puede estar en una env var `OWNER_USER_ID` o derivarse del primer usuario en la DB).
2. Llamar `holdings.listByUser(ownerId, { includeClosed: false })` y `watchlist.listByUser(ownerId)`.

Para v1 dejamos el esqueleto con comentario `TODO` que el implementer puede completar después de aplicar la migración con el userId real. Es deliberado — sin saber el userId del owner, el cron no puede listar.

Alternativa pragmática: agregar un método `listAll()` al `WatchlistRepository` y `HoldingRepository` (sin filtro por user). Implementarlo en v1 si el implementer juzga que vale la pena; si no, dejar el esqueleto vacío y el cron solo cachea el snapshot. Documentar la decisión en el report.

**Checkpoint Task 2.**

---

## Task 3: Vercel cron config

`vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/precache",
      "schedule": "0 23 * * *"
    }
  ]
}
```

Schedule: 23:00 UTC todos los días (que en CDMX es 17:00 — después del cierre del IPC). Si se quiere 23:00 CDMX, usar `0 5 * * *` (UTC).

**Checkpoint Task 3.**

---

## Task 4: Hook + componente DisclaimerModal

`src/hooks/useUserPreferences.ts`:

```ts
import { useQuery } from "@tanstack/react-query";

import type { UserPreferences } from "@/domain/entities/UserPreferences";

interface Response {
  preferences: UserPreferences;
}

export function useUserPreferences() {
  return useQuery<Response>({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/user-preferences");
      if (!res.ok) throw new Error("failed to fetch preferences");
      return res.json();
    },
  });
}
```

`src/components/DisclaimerModal/DisclaimerModal.tsx`:

```tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserPreferences } from "@/hooks/useUserPreferences";

/**
 * Modal bloqueante que aparece al primer login si el usuario no ha aceptado
 * el disclaimer. Al aceptar, persiste `disclaimerAcceptedAt = now` y se cierra.
 */
export function DisclaimerModal() {
  const { data } = useUserPreferences();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const open = !!data && data.preferences.disclaimerAcceptedAt === null;

  async function handleAccept(): Promise<void> {
    setSubmitting(true);
    try {
      const res = await fetch("/api/user-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disclaimerAcceptedAt: new Date().toISOString() }),
      });
      if (!res.ok) return;
      await queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl" hideClose>
        <DialogHeader>
          <DialogTitle>Aviso importante antes de continuar</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            Este sistema es una <strong>herramienta educativa y de gestión personal</strong>. No
            constituye asesoría financiera, recomendación de inversión, ni intermediación bursátil.
          </p>
          <p>
            Las decisiones de inversión son responsabilidad exclusiva del usuario. Los datos de
            mercado provienen de fuentes públicas y pueden tener retraso o errores. El simulador de
            paper trading es una práctica con dinero ficticio; los resultados no garantizan
            resultados futuros con dinero real.
          </p>
          <p>
            Para asesoría profesional consulta a un asesor financiero certificado o a tu
            intermediario bursátil (en este caso, GBM México).
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="accept-disclaimer"
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
          />
          <label htmlFor="accept-disclaimer" className="text-sm">
            Entiendo y acepto los términos.
          </label>
        </div>
        <Button onClick={handleAccept} disabled={!accepted || submitting} className="w-full">
          {submitting ? "Guardando..." : "Continuar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

Si shadcn `checkbox` y `dialog` no están, agregar con `pnpm dlx shadcn@latest add checkbox dialog`.

`index.ts`:

```ts
export { DisclaimerModal } from "./DisclaimerModal";
```

Insertar `<DisclaimerModal />` en `src/app/(app)/layout.tsx` para que aparezca en cualquier página autenticada hasta que se acepte.

**Checkpoint Task 4.**

---

## Task 5: Componentes de Landing

Crear cada uno en folder propio:

### Hero

`src/components/landing/Hero/Hero.tsx`:

```tsx
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Sección hero de la landing: título grande, descripción y CTA principal.
 */
export function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 text-center">
      <h1 className="mb-4 text-5xl font-semibold tracking-tight">BMV Stock</h1>
      <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
        Tu copiloto personal de inversión en BMV y SIC. Análisis con tooltips educativos, paper
        trading sin riesgo, y gestión de portafolio — todo en un solo lugar.
      </p>
      <div className="flex justify-center gap-3">
        <Button render={<Link href="/sign-in" />} size="lg" nativeButton={false}>
          Iniciar sesión
        </Button>
      </div>
    </section>
  );
}
```

`index.ts`:

```ts
export { Hero } from "./Hero";
```

### FeatureGrid

`src/components/landing/FeatureGrid/FeatureGrid.tsx`:

```tsx
import {
  LuChartCandlestick,
  LuCircleDollarSign,
  LuGraduationCap,
  LuListChecks,
  LuStar,
  LuTrendingUp,
} from "react-icons/lu";

import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: LuChartCandlestick,
    title: "Análisis con gráficas",
    description:
      "Velas, indicadores técnicos (RSI, MACD, medias móviles) y fundamentales con tooltips educativos.",
  },
  {
    icon: LuListChecks,
    title: "Paper trading",
    description: "Practica con $100,000 MXN ficticios antes de arriesgar capital real.",
  },
  {
    icon: LuCircleDollarSign,
    title: "Gestión de portafolio",
    description: "Registra tus trades de GBM+ y mide el desempeño contra el IPC.",
  },
  {
    icon: LuStar,
    title: "Watchlist",
    description: "Sigue las emisoras que te interesan con cotizaciones en casi tiempo real.",
  },
  {
    icon: LuTrendingUp,
    title: "Núcleo / satélite",
    description: "Calculadora de asignación base en ETFs según tu perfil de riesgo.",
  },
  {
    icon: LuGraduationCap,
    title: "Aprende invirtiendo",
    description: "Cada métrica viene con su explicación. Entiende lo que estás viendo.",
  },
];

/**
 * Grid de 6 features principales de la app.
 */
export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
        Lo que vas a tener
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title}>
              <CardContent className="space-y-2 pt-6">
                <Icon className="text-primary h-6 w-6" aria-hidden />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
```

`index.ts`:

```ts
export { FeatureGrid } from "./FeatureGrid";
```

### HowItWorks

`src/components/landing/HowItWorks/HowItWorks.tsx`:

```tsx
const steps = [
  {
    n: 1,
    title: "Practica gratis",
    description:
      "Inicia con $100,000 MXN ficticios en paper trading. Equivócate, aprende, descubre qué estrategias te resuenan.",
  },
  {
    n: 2,
    title: "Conoce tus métricas",
    description:
      "Cada gráfica e indicador viene con tooltip explicando qué significa. RSI, P/E, MACD, dividend yield — sin jerga.",
  },
  {
    n: 3,
    title: "Opera con confianza",
    description:
      "Cuando estés listo, registra tus trades reales de GBM+ y deja que el sistema calcule tu desempeño real.",
  },
];

/**
 * Sección "Cómo funciona" con 3 pasos.
 */
export function HowItWorks() {
  return (
    <section className="bg-muted/30 mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">Cómo funciona</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="space-y-3">
              <div className="bg-primary text-primary-foreground inline-flex h-9 w-9 items-center justify-center rounded-full font-mono font-semibold">
                {s.n}
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

`index.ts`:

```ts
export { HowItWorks } from "./HowItWorks";
```

### Disclaimer

`src/components/landing/Disclaimer/Disclaimer.tsx`:

```tsx
import { LuTriangleAlert } from "react-icons/lu";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Sección de disclaimer prominente antes del CTA final.
 */
export function Disclaimer() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="flex gap-3 pt-6">
          <LuTriangleAlert
            className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400"
            aria-hidden
          />
          <div className="space-y-2 text-sm">
            <p className="font-semibold">No es asesoría financiera.</p>
            <p className="text-muted-foreground leading-relaxed">
              Este sistema es una herramienta educativa y de gestión personal. No constituye
              asesoría financiera, recomendación de inversión, ni intermediación bursátil. Las
              decisiones son responsabilidad exclusiva del usuario. Para asesoría profesional
              consulta a un asesor financiero certificado o a GBM México.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
```

`index.ts`:

```ts
export { Disclaimer } from "./Disclaimer";
```

### LandingFooter

`src/components/landing/LandingFooter/LandingFooter.tsx`:

```tsx
/**
 * Footer minimalista de la landing pública.
 */
export function LandingFooter() {
  return (
    <footer className="border-border border-t py-8">
      <div className="text-muted-foreground mx-auto max-w-4xl px-4 text-center text-xs">
        <p>BMV Stock · Herramienta personal de gestión y educación financiera.</p>
        <p className="mt-1">No es asesoría financiera. Datos de mercado pueden tener retraso.</p>
      </div>
    </footer>
  );
}
```

`index.ts`:

```ts
export { LandingFooter } from "./LandingFooter";
```

### Reemplazar landing

`src/app/(public)/page.tsx`:

```tsx
import { Disclaimer } from "@/components/landing/Disclaimer";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * Landing pública. Hero + features + cómo funciona + disclaimer + footer.
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <Disclaimer />
      <LandingFooter />
    </>
  );
}
```

**Checkpoint Task 5.**

---

## Task 6: Página /settings real

Reemplazar `src/app/(app)/settings/page.tsx`:

```tsx
import { SettingsPageClient } from "./SettingsPageClient";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground text-sm">Personaliza cómo ves la app.</p>
      </div>
      <SettingsPageClient />
    </div>
  );
}
```

`src/app/(app)/settings/SettingsPageClient.tsx`:

Form con react-hook-form + Zod (`updateUserPreferencesSchema`) que muestra cada preference como Select/RadioGroup. Al cambiar cualquier valor, hacer PUT a `/api/user-preferences` y mostrar toast de éxito.

Campos:

- `displayCurrency` (RadioGroup MXN/USD)
- `defaultTimeframe` (Select 1D-5Y)
- `theme` (RadioGroup light/dark/system) — **al cambiar, llama también a `setTheme(value)` del hook `useTheme`** para aplicar inmediato
- `tableDensity` (RadioGroup compact/comfortable)
- `riskProfile` (RadioGroup CONSERVATIVE/MODERATE/AGGRESSIVE)

Usar `useUserPreferences()` para datos iniciales, `useEffect` para resetear el form cuando llegan los datos.

```tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { UpdateUserPreferencesInput } from "@/lib/schemas/userPreferences";

export function SettingsPageClient() {
  const { data, isLoading } = useUserPreferences();
  const { setTheme } = useTheme();
  const queryClient = useQueryClient();
  const form = useForm<UpdateUserPreferencesInput>({
    defaultValues: {},
  });

  // Reset form cuando llegan datos del server.
  useEffect(() => {
    if (data) {
      form.reset({
        displayCurrency: data.preferences.displayCurrency,
        defaultTimeframe: data.preferences.defaultTimeframe,
        theme: data.preferences.theme,
        tableDensity: data.preferences.tableDensity,
        riskProfile: data.preferences.riskProfile,
      });
    }
  }, [data, form]);

  async function handleSubmit(values: UpdateUserPreferencesInput): Promise<void> {
    const res = await fetch("/api/user-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error("Error al guardar");
      return;
    }
    if (values.theme) setTheme(values.theme);
    await queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    toast.success("Ajustes guardados");
  }

  if (isLoading || !data) {
    return <p className="text-muted-foreground text-sm">Cargando...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Field label="Moneda de display">
            <RadioGroup
              value={form.watch("displayCurrency")}
              onValueChange={(v) =>
                form.setValue("displayCurrency", v as "MXN" | "USD", { shouldDirty: true })
              }
              className="flex gap-3"
            >
              <Option value="MXN" label="Pesos (MXN)" />
              <Option value="USD" label="Dólares (USD)" />
            </RadioGroup>
          </Field>

          <Field label="Tema">
            <RadioGroup
              value={form.watch("theme")}
              onValueChange={(v) =>
                form.setValue("theme", v as "light" | "dark" | "system", { shouldDirty: true })
              }
              className="flex gap-3"
            >
              <Option value="light" label="Claro" />
              <Option value="dark" label="Oscuro" />
              <Option value="system" label="Sistema" />
            </RadioGroup>
          </Field>

          <Field label="Densidad de tablas">
            <RadioGroup
              value={form.watch("tableDensity")}
              onValueChange={(v) =>
                form.setValue("tableDensity", v as "compact" | "comfortable", { shouldDirty: true })
              }
              className="flex gap-3"
            >
              <Option value="compact" label="Compacta" />
              <Option value="comfortable" label="Cómoda" />
            </RadioGroup>
          </Field>

          <Field label="Perfil de riesgo">
            <RadioGroup
              value={form.watch("riskProfile")}
              onValueChange={(v) =>
                form.setValue("riskProfile", v as "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE", {
                  shouldDirty: true,
                })
              }
              className="flex gap-3"
            >
              <Option value="CONSERVATIVE" label="Conservador" />
              <Option value="MODERATE" label="Moderado" />
              <Option value="AGGRESSIVE" label="Agresivo" />
            </RadioGroup>
          </Field>

          <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
            Guardar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function Option({ value, label }: { value: string; label: string }) {
  const id = `setting-${value}`;
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem value={value} id={id} />
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
    </div>
  );
}
```

**Checkpoint Task 6.**

---

## Task 7: Página /core-allocation

Reemplazar `src/app/(app)/core-allocation/page.tsx`:

```tsx
import { CoreAllocationClient } from "./CoreAllocationClient";

export default function CoreAllocationPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Núcleo aburrido</h1>
        <p className="text-muted-foreground text-sm">
          Recomendación de asignación base en ETFs según tu perfil de riesgo. La parte
          estadísticamente más rentable de tu portafolio.
        </p>
      </div>
      <CoreAllocationClient />
    </div>
  );
}
```

`src/app/(app)/core-allocation/CoreAllocationClient.tsx`:

```tsx
"use client";

import { useState } from "react";

import { ConceptCard } from "@/components/education/ConceptCard";
import { TickerBadge } from "@/components/finance/TickerBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { AllocationBucket } from "@/application/core-allocation/recommendAllocation";

type RiskProfile = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";

const PROFILE_LABELS: Record<RiskProfile, string> = {
  CONSERVATIVE: "Conservador",
  MODERATE: "Moderado",
  AGGRESSIVE: "Agresivo",
};

export function CoreAllocationClient() {
  const [profile, setProfile] = useState<RiskProfile>("MODERATE");
  const [allocation, setAllocation] = useState<AllocationBucket[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleCalculate(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch("/api/core-allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskProfile: profile }),
      });
      if (res.ok) {
        const body = (await res.json()) as { allocation: AllocationBucket[] };
        setAllocation(body.allocation);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tu perfil de riesgo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={profile}
            onValueChange={(v) => setProfile(v as RiskProfile)}
            className="flex gap-3"
          >
            {(Object.keys(PROFILE_LABELS) as RiskProfile[]).map((p) => (
              <div key={p} className="flex items-center gap-2">
                <RadioGroupItem value={p} id={`profile-${p}`} />
                <label htmlFor={`profile-${p}`} className="text-sm">
                  {PROFILE_LABELS[p]}
                </label>
              </div>
            ))}
          </RadioGroup>
          <Button onClick={handleCalculate} disabled={loading}>
            {loading ? "Calculando..." : "Ver recomendación"}
          </Button>
        </CardContent>
      </Card>

      {allocation.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Asignación recomendada</h2>
          {allocation.map((b) => (
            <Card key={b.category}>
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">{b.label}</span>
                  <span className="font-mono text-2xl font-semibold">{b.percent}%</span>
                </div>
                <p className="text-muted-foreground text-xs">{b.rationale}</p>
                {b.suggestedTickers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {b.suggestedTickers.map((t) => (
                      <TickerBadge key={t} ticker={t} size="sm" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <ConceptCard concept="core-satellite" />
        </div>
      )}
    </div>
  );
}
```

**Checkpoint Task 7.**

---

## Task 8: Migración middleware → proxy (Next.js 16)

Renombrar `src/middleware.ts` a `src/proxy.ts`. El contenido NO cambia (Next.js 16 reconoce `proxy.ts` con la misma API que `middleware.ts`).

```bash
cd /Users/noel/REPOS/BMV-Stock
mv src/middleware.ts src/proxy.ts
```

Validar con `pnpm build` que no aparezca el deprecation warning.

**Checkpoint Task 8.**

---

## Task 9: Cleanup del react-patch (opcional pero recomendado)

El archivo `src/__tests__/react-patch.ts` se agregó en Plan 3 Batch D para resolver un problema de pnpm con instancias duplicadas de React. La solución más limpia y estándar es usar `public-hoist-pattern` en `.npmrc`:

Crear `.npmrc` en raíz:

```
public-hoist-pattern[]=*react*
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
shamefully-hoist=false
```

Después correr:

```bash
pnpm install
```

Validar `pnpm test` — si todo pasa, **eliminar** `src/__tests__/react-patch.ts` y removerlo de `vitest.config.ts` (la entrada en `setupFiles`).

Si tests fallan, restaurar y dejar el patch como concern documentada para v2.

**Checkpoint Task 9.**

---

## Task 10: README final

Reescribir `README.md` con:

1. Título + descripción + disclaimer.
2. Stack completo.
3. Setup local (pre-requisitos, instalación, env vars, db migrate, dev).
4. Scripts disponibles.
5. Arquitectura (4 capas + diagrama ASCII).
6. Estructura del repo.
7. Convenciones de código (no emojis, TSDoc, español-en-comentarios).
8. Roadmap de v1 (5 plans completados) y v2 (alertas, backtesting, screener, ISR).
9. Disclaimer legal completo.

Tener en cuenta lo aprendido de las 8 desviaciones del Plan 1 — documentar en una sección "Notas de versiones" si conviene.

**Checkpoint Task 10.**

---

## Task 11: Validación final v1

```bash
cd /Users/noel/REPOS/BMV-Stock
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Verificar:

- TODAS las páginas operativas (no más placeholders): `/`, `/sign-in`, `/sign-up`, `/dashboard`, `/portfolio`, `/portfolio/trade`, `/paper-trading`, `/paper-trading/trade`, `/paper-trading/history`, `/watchlist`, `/analysis`, `/analysis/[ticker]`, `/core-allocation`, `/settings`.
- TODOS los endpoints: `/api/quotes`, `/api/portfolio`, `/api/portfolio/trades`, `/api/paper-trading`, `/api/paper-trading/trades`, `/api/paper-trading/reset`, `/api/watchlist`, `/api/watchlist/[id]`, `/api/analysis/[ticker]`, `/api/dashboard`, `/api/user-preferences`, `/api/core-allocation`, `/api/cron/precache`.
- Sin warning de `middleware` deprecation (después de Task 8).
- Tests >150.

# Self-review

- [ ] User preferences use cases con TDD
- [ ] /api/user-preferences GET + PUT
- [ ] /api/core-allocation POST
- [ ] /api/cron/precache GET (esqueleto OK)
- [ ] vercel.json con cron config
- [ ] DisclaimerModal funcional
- [ ] 5 componentes de landing (Hero, FeatureGrid, HowItWorks, Disclaimer, LandingFooter)
- [ ] Landing page completa
- [ ] /settings funcional
- [ ] /core-allocation funcional
- [ ] middleware.ts → proxy.ts
- [ ] react-patch limpiado vía .npmrc (o documentado si no se pudo)
- [ ] README final
- [ ] Pasan validaciones
- [ ] Sin `git commit`

---

## v1 cerrado

Cuando este plan se ejecuta + Plan 1/2 keys validation se completa, **BMV Stock v1 está listo para deploy a Vercel**. Roadmap de v2:

- Alertas activas (email + Telegram).
- Backtesting de estrategias.
- Screener sobre todo el universo BMV.
- Cálculo de ISR mexicano.
- Múltiples portafolios paper.
- Métricas avanzadas (Sharpe, drawdown, beta vs IPC).
- Sentry/Axiom para observabilidad.
