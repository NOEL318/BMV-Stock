# BMV Stock · Plan 1 · Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Nota del usuario:** No correr `git commit` automáticamente. Cada tarea termina con un marcador "Checkpoint" que sugiere un buen momento para commitear, pero el ingeniero decide cuándo hacerlo.

**Goal:** Dejar el proyecto listo para construir features encima — Next.js + TypeScript strict + Tailwind + shadcn + Drizzle/Neon + Clerk auth + theme light/dark con paleta Bloomberg + layout con sidebar + dashboard vacío autenticado.

**Architecture:** Next.js 15 App Router con clean architecture (`/domain`, `/application`, `/infrastructure`, `/app`, `/components`). En Plan 1 sentamos las capas vacías y los providers (Clerk, TanStack Query, Theme). El dashboard solo muestra "Hola, [usuario]" para validar que el pipeline (auth → render autenticado) funciona end-to-end.

**Tech Stack:** Next.js 15, TypeScript 5.5+ strict, Tailwind 4, shadcn/ui, react-hook-form, Zod, TanStack Query v5, Clerk, Drizzle ORM, Neon Postgres, next-themes, Vitest + Testing Library.

**Spec referencia:** `docs/superpowers/specs/2026-05-06-bmv-stock-design.md`

---

## File structure que se creará en este plan

```
bmv-stock/
├── .env.example
├── .env.local                            ← gitignored
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── README.md
├── components.json                       ← shadcn config
├── drizzle.config.ts
├── middleware.ts
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── docs/superpowers/
│   ├── plans/2026-05-06-plan-1-foundation.md   ← este archivo
│   └── specs/2026-05-06-bmv-stock-design.md
├── drizzle/                                    ← migraciones generadas
├── public/
└── src/
    ├── app/
    │   ├── (app)/
    │   │   ├── dashboard/page.tsx
    │   │   └── layout.tsx
    │   ├── (public)/
    │   │   ├── layout.tsx
    │   │   └── page.tsx                        ← landing placeholder
    │   ├── sign-in/[[...sign-in]]/page.tsx
    │   ├── sign-up/[[...sign-up]]/page.tsx
    │   ├── globals.css
    │   ├── layout.tsx                          ← root con providers
    │   └── providers.tsx                       ← QueryClient, Theme, Toast
    ├── components/
    │   ├── ui/                                 ← shadcn primitives
    │   └── layout/
    │       ├── Sidebar/
    │       │   ├── Sidebar.tsx
    │       │   ├── Sidebar.types.ts
    │       │   ├── Sidebar.styles.ts
    │       │   └── index.ts
    │       └── TopNav/
    │           ├── TopNav.tsx
    │           ├── TopNav.types.ts
    │           ├── TopNav.styles.ts
    │           └── index.ts
    ├── domain/                                 ← carpetas vacías con .gitkeep
    │   ├── entities/.gitkeep
    │   ├── value-objects/.gitkeep
    │   ├── errors/.gitkeep
    │   └── ports/.gitkeep
    ├── application/.gitkeep
    ├── infrastructure/
    │   ├── auth/clerk.ts
    │   └── db/
    │       ├── client.ts
    │       └── schema.ts                       ← solo tabla users en este plan
    └── lib/
        ├── format/.gitkeep
        ├── schemas/.gitkeep
        └── utils.ts                            ← cn() helper de shadcn
```

---

## Pre-requisitos del entorno

Antes de empezar, el ingeniero debe tener:

- Node.js 20+ instalado.
- `pnpm` instalado globalmente (`npm i -g pnpm`).
- Cuenta gratuita en [Neon](https://neon.tech) → crear proyecto `bmv-stock` → copiar `DATABASE_URL` (con pooling) y `DATABASE_URL_UNPOOLED` (direct).
- Cuenta gratuita en [Clerk](https://clerk.com) → crear application `bmv-stock` → copiar `Publishable key` y `Secret key`. En "User & Authentication" → "Email, Phone, Username" activar "Email address" + "Email verification code". Activar "Restrictions" → "Restrict sign-ups by allowlist" y agregar el email autorizado.

---

## Task 1: Inicializar el proyecto Next.js

**Files:**

- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1.1: Crear el proyecto con `create-next-app`**

Run:

```bash
cd /Users/noel/REPOS
pnpm dlx create-next-app@latest bmv-stock \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm
```

Si el wizard pregunta por Turbopack, elegir `No` (queremos webpack para máxima compatibilidad inicial con shadcn). Si pregunta por shadcn integrado, también `No` — instalamos shadcn manualmente en la Task 4.

Expected: folder `bmv-stock` creado con estructura base.

- [ ] **Step 1.2: Ajustar `tsconfig.json` a strict completo**

Reemplazar el contenido de `tsconfig.json` con:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 1.3: Validar que el proyecto compila**

Run:

```bash
cd bmv-stock
pnpm tsc --noEmit
pnpm dev
```

Expected: typecheck pasa sin errores; dev server arriba en `http://localhost:3000`. Detener con Ctrl+C.

- [ ] **Step 1.4: Agregar `.gitignore` ampliado**

Sobrescribir `.gitignore` con:

```gitignore
# dependencies
node_modules
.pnp
.pnp.js
.yarn/install-state.gz

# testing
coverage

# next.js
.next/
out/

# production
build
dist

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
.env
.env*.local

# typescript
*.tsbuildinfo
next-env.d.ts

# vercel
.vercel

# IDE
.vscode/
.idea/

# drizzle
drizzle/meta/_journal.json.bak
```

**Checkpoint:** Proyecto Next.js inicializado y compilando.

---

## Task 2: Configurar ESLint y Prettier estrictos

**Files:**

- Create: `.eslintrc.cjs`, `.prettierrc`, `.prettierignore`
- Modify: `package.json`

- [ ] **Step 2.1: Instalar dependencias de lint/format**

Run:

```bash
pnpm add -D \
  prettier \
  prettier-plugin-tailwindcss \
  eslint-config-prettier \
  eslint-plugin-import \
  eslint-import-resolver-typescript \
  eslint-plugin-tsdoc
```

- [ ] **Step 2.2: Crear `.eslintrc.cjs`**

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [
    "next/core-web-vitals",
    "next/typescript",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  plugins: ["import", "tsdoc"],
  settings: {
    "import/resolver": {
      typescript: { project: "./tsconfig.json" },
    },
  },
  rules: {
    "tsdoc/syntax": "warn",
    "import/order": [
      "warn",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],
    "import/no-default-export": "off",
    "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    // Reglas de capas (clean architecture). Se enforzan en plan 2 cuando existan los folders.
    "import/no-restricted-paths": "off",
  },
};
```

- [ ] **Step 2.3: Crear `.prettierrc`**

```json
{
  "printWidth": 100,
  "singleQuote": false,
  "trailingComma": "all",
  "semi": true,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 2.4: Crear `.prettierignore`**

```
.next
node_modules
drizzle
public
pnpm-lock.yaml
*.lock
```

- [ ] **Step 2.5: Agregar scripts en `package.json`**

Editar `package.json`, sección `scripts`, dejar así:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 2.6: Validar lint + format**

Run:

```bash
pnpm format
pnpm lint
pnpm typecheck
```

Expected: los tres pasan sin errores.

**Checkpoint:** Tooling de lint/format configurado.

---

## Task 3: Configurar Vitest

**Files:**

- Create: `vitest.config.ts`, `src/__tests__/setup.ts`

- [ ] **Step 3.1: Instalar Vitest y librerías de test**

Run:

```bash
pnpm add -D \
  vitest \
  @vitejs/plugin-react \
  @testing-library/react \
  @testing-library/dom \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom
```

- [ ] **Step 3.2: Crear `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/domain/**", "src/application/**"],
      thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3.3: Crear setup file con jest-dom matchers**

`src/__tests__/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 3.4: Crear test sanity para validar que Vitest corre**

`src/__tests__/sanity.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("Vitest sanity", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3.5: Correr el test**

Run:

```bash
pnpm test
```

Expected: 1 test passed.

**Checkpoint:** Vitest funcionando.

---

## Task 4: Instalar y configurar shadcn/ui + tema base

**Files:**

- Create: `components.json`, `src/lib/utils.ts`
- Modify: `src/app/globals.css`, `tailwind.config.ts`

- [ ] **Step 4.1: Inicializar shadcn**

Run:

```bash
pnpm dlx shadcn@latest init
```

Responder al wizard:

- Style: `Default`
- Base color: `Zinc`
- CSS variables: `Yes`
- React Server Components: `Yes`
- Components alias: `@/components`
- Utilities alias: `@/lib/utils`

Esto genera `components.json`, `src/lib/utils.ts` (con `cn()`), reemplaza `globals.css` con CSS variables base, y agrega `tailwind-merge` + `clsx` a deps.

- [ ] **Step 4.2: Aplicar paleta Bloomberg-style en `globals.css`**

Después de correr `shadcn init`, el archivo `src/app/globals.css` ya tiene los imports/directivas de Tailwind y bloques `:root` y `.dark` con valores default. **Conservar** los imports/directivas que shadcn escribió arriba (sea `@import "tailwindcss";` para Tailwind 4 o `@tailwind base; @tailwind components; @tailwind utilities;` para Tailwind 3) y **reemplazar el contenido** de los bloques `:root { ... }` y `.dark { ... }` con los valores de paleta siguientes. Agregar al final el bloque `@layer base` con los selectores universales y la clase `.tabular-nums`.

```css
/* Mantener arriba lo que shadcn init escribió (directivas Tailwind y plugin base). */

@layer base {
  :root {
    /* Bloomberg-style light */
    --background: 0 0% 98%; /* #FAFAFA */
    --foreground: 0 0% 4%; /* #0A0A0A */
    --card: 0 0% 100%; /* #FFFFFF */
    --card-foreground: 0 0% 4%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 4%;
    --primary: 224 76% 33%; /* #1E3A8A azul marino */
    --primary-foreground: 0 0% 100%;
    --secondary: 240 5% 96%; /* #F4F4F5 */
    --secondary-foreground: 0 0% 4%;
    --muted: 240 5% 96%;
    --muted-foreground: 240 4% 46%; /* #71717A */
    --accent: 240 5% 96%;
    --accent-foreground: 0 0% 4%;
    --destructive: 0 72% 51%; /* #DC2626 */
    --destructive-foreground: 0 0% 100%;
    --success: 142 71% 36%; /* #16A34A */
    --success-foreground: 0 0% 100%;
    --border: 240 6% 90%; /* #E4E4E7 */
    --input: 240 6% 90%;
    --ring: 224 76% 33%;
    --radius: 0.5rem;
  }

  .dark {
    /* Bloomberg-style dark */
    --background: 240 10% 4%; /* #09090B */
    --foreground: 0 0% 98%; /* #FAFAFA */
    --card: 240 6% 10%; /* #18181B */
    --card-foreground: 0 0% 98%;
    --popover: 240 6% 10%;
    --popover-foreground: 0 0% 98%;
    --primary: 213 94% 68%; /* #60A5FA azul claro */
    --primary-foreground: 240 10% 4%;
    --secondary: 240 4% 16%; /* #27272A */
    --secondary-foreground: 0 0% 98%;
    --muted: 240 4% 16%;
    --muted-foreground: 240 5% 65%; /* #A1A1AA */
    --accent: 240 4% 16%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84% 60%; /* #EF4444 */
    --destructive-foreground: 0 0% 98%;
    --success: 142 71% 45%; /* #22C55E */
    --success-foreground: 0 0% 98%;
    --border: 240 4% 16%;
    --input: 240 4% 16%;
    --ring: 213 94% 68%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings:
      "rlig" 1,
      "calt" 1;
  }
  /* Para números financieros: alineación tabular */
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
}
```

- [ ] **Step 4.3: Extender `tailwind.config.ts` para mapear `success`**

shadcn por default no expone `success`. Editar `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

- [ ] **Step 4.4: Instalar primitivas iniciales de shadcn**

Run:

```bash
pnpm dlx shadcn@latest add button card input label dialog dropdown-menu sonner separator badge skeleton avatar
```

Expected: archivos en `src/components/ui/*.tsx`.

- [ ] **Step 4.5: Validar build**

Run:

```bash
pnpm typecheck
pnpm build
```

Expected: build pasa.

**Checkpoint:** shadcn configurado con paleta Bloomberg-style.

---

## Task 5: Configurar fuentes Inter + JetBrains Mono

**Files:**

- Modify: `src/app/layout.tsx`

- [ ] **Step 5.1: Importar fuentes en root layout**

Reemplazar el contenido de `src/app/layout.tsx` con:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BMV Stock",
  description: "Tu copiloto de inversión en BMV y SIC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetBrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5.2: Validar dev**

Run:

```bash
pnpm dev
```

Abrir `http://localhost:3000` y validar que la fuente Inter está aplicada (visualmente).

**Checkpoint:** Fuentes configuradas.

---

## Task 6: Configurar variables de entorno

**Files:**

- Create: `.env.example`, `.env.local`

- [ ] **Step 6.1: Crear `.env.example`**

```
# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
```

- [ ] **Step 6.2: Crear `.env.local` con valores reales**

Copiar `.env.example` a `.env.local` y llenar con los valores reales de Neon y Clerk obtenidos en pre-requisitos.

```bash
cp .env.example .env.local
# editar .env.local con los valores reales
```

- [ ] **Step 6.3: Crear `src/env.ts` para validar variables con Zod**

Instalar Zod:

```bash
pnpm add zod
```

Crear `src/env.ts`:

```ts
import { z } from "zod";

/**
 * Schema de variables de entorno requeridas por la app.
 * Se valida al iniciar el server; falla rápido si falta alguna.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: z.string().default("/dashboard"),
  NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: z.string().default("/dashboard"),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL:
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL:
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL,
});

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
```

**Checkpoint:** Variables de entorno validadas.

---

## Task 7: Configurar Drizzle ORM + Neon

**Files:**

- Create: `drizzle.config.ts`, `src/infrastructure/db/client.ts`, `src/infrastructure/db/schema.ts`

- [ ] **Step 7.1: Instalar Drizzle y driver de Neon**

Run:

```bash
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit
```

- [ ] **Step 7.2: Crear `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./src/infrastructure/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
  verbose: true,
  strict: true,
});
```

- [ ] **Step 7.3: Crear cliente Drizzle**

`src/infrastructure/db/client.ts`:

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/env";

import * as schema from "./schema";

/**
 * Cliente Drizzle con HTTP driver de Neon (compatible con edge/serverless).
 * Usar el `DATABASE_URL` con pooling para rutas de la app;
 * `DATABASE_URL_UNPOOLED` se reserva para migraciones.
 */
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export type Database = typeof db;
```

- [ ] **Step 7.4: Crear schema mínimo (solo tabla users)**

`src/infrastructure/db/schema.ts`:

```ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Espejo del usuario de Clerk.
 * Almacenamos `id` (Clerk userId) y `email` para FK desde otras tablas
 * y para auditoría. La identidad y la sesión las maneja Clerk.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DbUser = typeof users.$inferSelect;
export type DbNewUser = typeof users.$inferInsert;
```

- [ ] **Step 7.5: Generar primera migración**

Run:

```bash
pnpm dlx drizzle-kit generate
```

Expected: archivo `drizzle/0000_xxx.sql` creado con `CREATE TABLE users (...)`.

- [ ] **Step 7.6: Aplicar migración a Neon**

Run:

```bash
pnpm dlx drizzle-kit migrate
```

Expected: migración aplicada. Verificar en dashboard de Neon que la tabla `users` existe.

- [ ] **Step 7.7: Agregar scripts de Drizzle a `package.json`**

En `package.json`, agregar a `scripts`:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

**Checkpoint:** Drizzle conectado a Neon, tabla `users` creada.

---

## Task 8: Configurar Clerk auth + middleware

**Files:**

- Create: `middleware.ts`, `src/infrastructure/auth/clerk.ts`, `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 8.1: Instalar Clerk**

Run:

```bash
pnpm add @clerk/nextjs
```

- [ ] **Step 8.2: Crear `middleware.ts` en la raíz**

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Rutas públicas que no requieren autenticación.
 * Cualquier ruta no listada aquí queda protegida por Clerk.
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals y archivos estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre correr para API routes
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 8.3: Crear helper `getCurrentUser`**

`src/infrastructure/auth/clerk.ts`:

```ts
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Obtiene el `userId` del usuario autenticado o lanza si no hay sesión.
 * Para uso en Route Handlers protegidos.
 *
 * @throws Error con status 401 si no hay sesión
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return userId;
}

/**
 * Obtiene el usuario completo de Clerk.
 * Devuelve null si no hay sesión.
 */
export async function getCurrentClerkUser() {
  return await currentUser();
}
```

- [ ] **Step 8.4: Crear páginas de sign-in y sign-up**

`src/app/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignIn />
    </div>
  );
}
```

`src/app/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 8.5: Probar middleware**

Run:

```bash
pnpm dev
```

Abrir `http://localhost:3000/dashboard` (no existe aún pero el middleware debe redirigir). Expected: redirect a `/sign-in`.

**Checkpoint:** Clerk middleware funcionando.

---

## Task 9: Crear providers (Clerk, TanStack Query, Theme, Toast)

**Files:**

- Create: `src/app/providers.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 9.1: Instalar TanStack Query y next-themes**

Run:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools next-themes
```

- [ ] **Step 9.2: Crear `src/app/providers.tsx`**

```tsx
"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { Toaster } from "@/components/ui/sonner";

/**
 * Providers globales de la app:
 * - ClerkProvider: identidad y sesión.
 * - ThemeProvider: light/dark via clase en <html> + persistencia.
 * - QueryClientProvider: cache y sincronización de datos del servidor.
 * - Toaster: notificaciones de Sonner (componente de shadcn).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // useState para que el QueryClient sea estable a través de re-renders
  // y evitar compartir cache entre usuarios en SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1 min: la mayoría de datos no cambian seguido
            refetchOnWindowFocus: false, // evita refetch agresivo en finanzas
            retry: 1,
          },
        },
      }),
  );

  return (
    <ClerkProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster richColors closeButton />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
```

- [ ] **Step 9.3: Envolver root layout con Providers**

Reemplazar `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { Providers } from "./providers";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BMV Stock",
  description: "Tu copiloto de inversión en BMV y SIC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetBrainsMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 9.4: Validar dev server**

Run:

```bash
pnpm dev
```

Expected: arranca sin errores.

**Checkpoint:** Providers globales en su sitio.

---

## Task 10: Crear layout autenticado con Sidebar y TopNav (placeholders)

**Files:**

- Create:
  - `src/components/layout/Sidebar/Sidebar.tsx`
  - `src/components/layout/Sidebar/Sidebar.types.ts`
  - `src/components/layout/Sidebar/Sidebar.styles.ts`
  - `src/components/layout/Sidebar/index.ts`
  - `src/components/layout/TopNav/TopNav.tsx`
  - `src/components/layout/TopNav/TopNav.types.ts`
  - `src/components/layout/TopNav/TopNav.styles.ts`
  - `src/components/layout/TopNav/index.ts`
  - `src/app/(app)/layout.tsx`
  - `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 10.1: Instalar React Icons + class-variance-authority (si no está)**

Run:

```bash
pnpm add react-icons class-variance-authority
```

(`class-variance-authority` ya viene con shadcn, pero es buena práctica asegurar.)

- [ ] **Step 10.2: Crear `Sidebar.types.ts`**

`src/components/layout/Sidebar/Sidebar.types.ts`:

```ts
import type { IconType } from "react-icons";

/**
 * Estructura de un item del sidebar.
 * `icon` se acepta como componente de react-icons o cualquier IconType.
 */
export interface SidebarItem {
  href: string;
  label: string;
  icon: IconType;
}

export interface SidebarProps {
  items: SidebarItem[];
  /**
   * Variante visual del sidebar.
   * - `expanded`: muestra label + icon (default, ≥md)
   * - `compact`: solo icon, label en tooltip
   */
  variant?: "expanded" | "compact";
  className?: string;
}
```

- [ ] **Step 10.3: Crear `Sidebar.styles.ts`**

`src/components/layout/Sidebar/Sidebar.styles.ts`:

```ts
import { cva } from "class-variance-authority";

/**
 * Variantes del contenedor del sidebar.
 * `expanded` reserva ancho fijo para labels; `compact` solo cabe iconos.
 */
export const sidebarVariants = cva(
  "flex h-full flex-col gap-1 border-r bg-card p-3 text-card-foreground",
  {
    variants: {
      variant: {
        expanded: "w-56",
        compact: "w-14",
      },
    },
    defaultVariants: { variant: "expanded" },
  },
);

/**
 * Variantes de cada item del sidebar.
 * El estado activo lo aplica el componente al detectar match con la ruta.
 */
export const sidebarItemVariants = cva(
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
  {
    variants: {
      active: {
        true: "bg-muted text-foreground",
        false: "text-muted-foreground",
      },
      variant: {
        expanded: "justify-start",
        compact: "justify-center",
      },
    },
    defaultVariants: { active: false, variant: "expanded" },
  },
);
```

- [ ] **Step 10.4: Crear `Sidebar.tsx`**

`src/components/layout/Sidebar/Sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { sidebarItemVariants, sidebarVariants } from "./Sidebar.styles";
import type { SidebarProps } from "./Sidebar.types";

/**
 * Sidebar de navegación principal.
 * Resalta el item activo comparando `pathname` con el `href` de cada item.
 */
export function Sidebar({ items, variant = "expanded", className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(sidebarVariants({ variant }), className)}>
      <div className="mb-4 px-3 py-2">
        <span className="font-semibold tracking-tight">
          {variant === "expanded" ? "BMV Stock" : "GC"}
        </span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={sidebarItemVariants({ active, variant })}
              aria-label={item.label}
            >
              <Icon aria-hidden className="h-4 w-4 shrink-0" />
              {variant === "expanded" && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 10.5: Crear `Sidebar/index.ts`**

```ts
export { Sidebar } from "./Sidebar";
export type { SidebarItem, SidebarProps } from "./Sidebar.types";
```

- [ ] **Step 10.6: Crear `TopNav.types.ts`**

`src/components/layout/TopNav/TopNav.types.ts`:

```ts
export interface TopNavProps {
  className?: string;
}
```

- [ ] **Step 10.7: Crear `TopNav.styles.ts`**

`src/components/layout/TopNav/TopNav.styles.ts`:

```ts
import { cva } from "class-variance-authority";

export const topNavVariants = cva(
  "flex h-14 items-center justify-between border-b bg-background px-4",
);
```

- [ ] **Step 10.8: Crear `TopNav.tsx`**

`src/components/layout/TopNav/TopNav.tsx`:

```tsx
"use client";

import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { LuMoon, LuSun } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { topNavVariants } from "./TopNav.styles";
import type { TopNavProps } from "./TopNav.types";

/**
 * Barra superior con toggle de tema y `UserButton` de Clerk.
 * El toggle alterna entre light y dark; el modo "system" se setea desde Settings.
 */
export function TopNav({ className }: TopNavProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className={cn(topNavVariants(), className)}>
      <div className="text-muted-foreground text-sm">{/* Espacio para breadcrumbs futuros */}</div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Cambiar tema"
        >
          {isDark ? <LuSun className="h-4 w-4" /> : <LuMoon className="h-4 w-4" />}
        </Button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
```

- [ ] **Step 10.9: Crear `TopNav/index.ts`**

```ts
export { TopNav } from "./TopNav";
export type { TopNavProps } from "./TopNav.types";
```

- [ ] **Step 10.10: Crear layout autenticado**

`src/app/(app)/layout.tsx`:

```tsx
import {
  LuChartCandlestick,
  LuChartPie,
  LuCircleDollarSign,
  LuLayoutDashboard,
  LuListChecks,
  LuSettings,
  LuStar,
} from "react-icons/lu";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import type { SidebarItem } from "@/components/layout/Sidebar";

/**
 * Items de navegación para la app autenticada.
 * Conforme se agreguen rutas en planes posteriores, se extiende esta lista.
 */
const SIDEBAR_ITEMS: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
  { href: "/portfolio", label: "Portafolio", icon: LuCircleDollarSign },
  { href: "/paper-trading", label: "Paper Trading", icon: LuListChecks },
  { href: "/watchlist", label: "Watchlist", icon: LuStar },
  { href: "/analysis", label: "Análisis", icon: LuChartCandlestick },
  { href: "/core-allocation", label: "Núcleo", icon: LuChartPie },
  { href: "/settings", label: "Ajustes", icon: LuSettings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex h-screen">
      <Sidebar items={SIDEBAR_ITEMS} variant="expanded" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 10.11: Crear página dashboard placeholder**

`src/app/(app)/dashboard/page.tsx`:

```tsx
import { currentUser } from "@clerk/nextjs/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Dashboard placeholder.
 * Solo muestra el saludo al usuario autenticado para validar que el pipeline
 * (middleware Clerk → render server-side autenticado) funciona end-to-end.
 * El contenido real se construye en el Plan 4.
 */
export default async function DashboardPage() {
  const user = await currentUser();
  const greeting = user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? "inversionista";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Hola, {greeting}</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Tu copiloto está listo. En los próximos planes se construyen los módulos de portafolio,
        paper trading, watchlist y análisis.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Foundation lista</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Si estás viendo esta pantalla, todo el pipeline está funcionando: auth, theme, layout,
          rutas protegidas y conexión a la base de datos.
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 10.12: Crear landing pública placeholder**

`src/app/(public)/layout.tsx`:

```tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-background min-h-screen">{children}</div>;
}
```

`src/app/(public)/page.tsx` (sobreescribiendo el `app/page.tsx` por default):

```tsx
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Landing pública placeholder.
 * Solo título, descripción y CTA a sign-in. El landing completo (Hero,
 * FeatureGrid, HowItWorks, Disclaimer, Footer) se construye en el Plan 5.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">BMV Stock</h1>
      <p className="text-muted-foreground max-w-md">
        Tu copiloto de inversión en BMV y SIC. Análisis, paper trading y gestión de portafolio.
      </p>
      <Button asChild size="lg">
        <Link href="/sign-in">Iniciar sesión</Link>
      </Button>
    </div>
  );
}
```

Borrar el `src/app/page.tsx` original (si existe) — fue reemplazado por `(public)/page.tsx`.

```bash
rm src/app/page.tsx
```

- [ ] **Step 10.13: Smoke test end-to-end**

Run:

```bash
pnpm dev
```

Validaciones:

1. Abrir `http://localhost:3000/` → ver landing pública.
2. Click "Iniciar sesión" → redirect a `/sign-in` con UI de Clerk.
3. Hacer sign-in con el email autorizado.
4. Después del login → redirect a `/dashboard` → ver "Hola, [tu nombre]" + sidebar + topnav.
5. Click toggle de tema en topnav → la app cambia entre light/dark con la paleta correcta.
6. Click `UserButton` (avatar) → "Sign out" → regresa a landing.

**Checkpoint:** Foundation funcional end-to-end.

---

## Task 11: Crear test del componente Sidebar

**Files:**

- Create: `src/components/layout/Sidebar/Sidebar.test.tsx`

- [ ] **Step 11.1: Mockear `usePathname` para tests**

Necesitamos poder controlar el pathname en los tests. Crear el test:

`src/components/layout/Sidebar/Sidebar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { LuHome, LuStar } from "react-icons/lu";
import { describe, expect, it, vi } from "vitest";

import { Sidebar } from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

describe("Sidebar", () => {
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LuHome },
    { href: "/watchlist", label: "Watchlist", icon: LuStar },
  ];

  it("renderiza todos los items con su label en variant expanded", () => {
    render(<Sidebar items={items} variant="expanded" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Watchlist")).toBeInTheDocument();
  });

  it("oculta labels en variant compact", () => {
    render(<Sidebar items={items} variant="compact" />);
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Watchlist")).not.toBeInTheDocument();
  });

  it("marca el item activo según el pathname actual", () => {
    render(<Sidebar items={items} />);
    const dashboardLink = screen.getByLabelText("Dashboard");
    const watchlistLink = screen.getByLabelText("Watchlist");
    // El item activo tiene la clase de bg-muted (de sidebarItemVariants).
    expect(dashboardLink.className).toContain("bg-muted");
    expect(watchlistLink.className).not.toContain("bg-muted");
  });
});
```

- [ ] **Step 11.2: Correr el test**

Run:

```bash
pnpm test src/components/layout/Sidebar
```

Expected: 3 tests passed.

**Checkpoint:** Sidebar con tests.

---

## Task 12: Crear README inicial

**Files:**

- Create: `README.md`

- [ ] **Step 12.1: Escribir README mínimo**

`README.md`:

```markdown
# BMV Stock

Aplicación web personal de análisis, paper trading y gestión de portafolio para
inversionistas individuales en GBM México.

> **Disclaimer.** Este sistema es una **herramienta educativa y de gestión personal**.
> No constituye asesoría financiera, recomendación de inversión, ni intermediación
> bursátil. Las decisiones de inversión son responsabilidad exclusiva del usuario.

## Documentación

- Spec: [`docs/superpowers/specs/2026-05-06-bmv-stock-design.md`](docs/superpowers/specs/2026-05-06-bmv-stock-design.md)
- Planes de implementación: [`docs/superpowers/plans/`](docs/superpowers/plans/)

## Stack

- Next.js 15 (App Router) · TypeScript strict
- Tailwind CSS · shadcn/ui · React Icons · Lightweight Charts
- TanStack Query · react-hook-form · Zod
- Drizzle ORM · Neon Postgres
- Clerk (auth)
- Vitest + Testing Library

## Setup local

### 1. Pre-requisitos

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- Cuenta en Neon (free tier) → proyecto creado, copiar `DATABASE_URL` y `DATABASE_URL_UNPOOLED`
- Cuenta en Clerk (free tier) → application creada, allowlist con tu email autorizado

### 2. Instalar y configurar

\`\`\`bash
pnpm install
cp .env.example .env.local

# Llenar .env.local con DATABASE*URL, CLERK*\*, etc.

pnpm db:migrate
pnpm dev
\`\`\`

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

- `pnpm dev` · servidor de desarrollo
- `pnpm build` · build de producción
- `pnpm test` · tests con Vitest
- `pnpm lint` · ESLint
- `pnpm typecheck` · TypeScript
- `pnpm format` · Prettier (escribir)
- `pnpm db:generate` · generar migración Drizzle desde schema
- `pnpm db:migrate` · aplicar migraciones
- `pnpm db:studio` · UI para explorar la DB

## Arquitectura

Clean architecture en cuatro capas:

\`\`\`
src/
├── app/ ← Presentation (Next.js)
├── domain/ ← Entities, value objects, ports (sin deps externas)
├── application/ ← Use cases (orquestan domain)
├── infrastructure/ ← Adaptadores (DB, Yahoo, Clerk)
└── components/ ← UI reusable (cada componente en su folder)
\`\`\`

Ver el spec para detalles.

## Roadmap

- Plan 1 · Foundation (este plan)
- Plan 2 · Domain + Yahoo
- Plan 3 · Portafolio Real + Paper Trading
- Plan 4 · Watchlist + Análisis + Dashboard
- Plan 5 · Landing + Settings + Polish
```

**Checkpoint:** README inicial.

---

## Task 13: Validación final del Plan 1

- [ ] **Step 13.1: Correr toda la pipeline**

Run en orden:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: las cinco pasan sin errores.

- [ ] **Step 13.2: Smoke test manual**

```bash
pnpm dev
```

Validar de nuevo el flujo completo del Step 10.13.

- [ ] **Step 13.3: Asegurar que `.env.local` no está commiteado**

Run:

```bash
git status
```

Expected: `.env.local` no aparece (lo cubre `.gitignore`).

**Checkpoint final:** Plan 1 listo. La app deployable a Vercel ya tiene todo el pipeline funcionando: auth + DB + theme + layout. Las próximas features se montan encima sin tocar foundation.

---

## Lo que sigue (Plan 2)

El **Plan 2: Domain + Yahoo** cubrirá:

- Capa de dominio completa: entidades (`Holding`, `Trade`, `PaperPortfolio`, etc.), value objects (`Money`, `Ticker`, `Percentage`), errors de dominio, ports.
- Schema Drizzle completo + repositories.
- `YahooMarketDataProvider` + `CachedMarketDataProvider`.
- Use cases de quotes y market snapshot.
- Endpoint `/api/quotes?ticker=...` operativo.
- Lint rule `import/no-restricted-paths` activada para enforcer las capas.
- Tests del dominio y de los use cases con cobertura ≥90%.

Cuando el Plan 1 esté ejecutado y verificado, escribir el Plan 2.
