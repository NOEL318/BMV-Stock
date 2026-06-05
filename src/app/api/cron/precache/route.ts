import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { Ticker } from "@/domain/value-objects/Ticker";

/**
 * Compara dos strings en tiempo constante para evitar timing attacks sobre el
 * secreto del cron. Devuelve false si difieren en longitud.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * GET /api/cron/precache
 *
 * Endpoint invocado por el cron de Vercel cada noche a las 05:00 UTC
 * (23:00 CDMX, después del cierre del IPC).
 *
 * Pre-cachea las cotizaciones de:
 * - Benchmarks (IPC, USDMXN, S&P 500, NASDAQ) via getMarketSnapshot.
 * - Todos los tickers únicos en watchlist + holdings de todos los usuarios.
 *
 * Nota: en single-user este "todos los usuarios" es solo uno. La estructura
 * permite extender a multi-user sin refactor cuando se agregue un método
 * `listAll()` a los repositorios.
 *
 * Auth: requiere header `Authorization: Bearer CRON_SECRET`. Vercel lo
 * configura automáticamente en cron requests. Si `CRON_SECRET` no está
 * definido en el entorno, el endpoint responde sin verificar (solo desarrollo
 * local). En produccion se registra una advertencia para que no pase
 * inadvertido un cron sin proteger.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (!safeEqual(auth, `Bearer ${secret}`)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn("/api/cron/precache: CRON_SECRET no definido; el endpoint queda sin proteger.");
  }

  const { holdings, watchlist, marketData } = getDeps();

  const errors: string[] = [];
  let succeeded = 0;

  // 1. Pre-cachear el market snapshot (IPC, USDMXN, S&P 500, NASDAQ).
  try {
    await marketData.getMarketSnapshot();
    // getMarketSnapshot pre-cachea los 4 benchmarks a la vez.
    succeeded += 4;
  } catch (e) {
    errors.push(`snapshot: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Recolectar tickers únicos de holdings + watchlist.
  // TODO(v2): cuando se agregue un método `listAll()` a los repositorios,
  // llamarlo aquí para pre-cachear todos los tickers de todos los usuarios.
  // Por ahora el cron solo cachea los benchmarks del snapshot.
  // Para un deploy single-user, se puede definir OWNER_USER_ID en env y
  // descomentar el bloque de abajo:
  //
  //   const ownerId = process.env.OWNER_USER_ID;
  //   if (ownerId) {
  //     const allHoldings = await holdings.listByUser(ownerId, { includeClosed: false });
  //     const allWatchlist = await watchlist.listByUser(ownerId);
  //     ...
  //   }
  const allHoldings = await collectAllHoldings(holdings);
  const allWatchlist = await collectAllWatchlist(watchlist);

  const tickers = new Set<string>();
  for (const h of allHoldings) {
    tickers.add(h.exchange === "BMV" ? `${h.ticker}.MX` : h.ticker);
  }
  for (const w of allWatchlist) {
    tickers.add(w.exchange === "BMV" ? `${w.ticker}.MX` : w.ticker);
  }

  // 3. Pre-cachear cada ticker individual.
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

/**
 * Recolecta todos los holdings para pre-cache.
 * En v1 single-user retorna array vacío hasta que se agregue `listAll()`
 * o se configure `OWNER_USER_ID`.
 *
 * @returns Lista de holdings a pre-cachear (vacía en v1).
 */
async function collectAllHoldings(_repo: ReturnType<typeof getDeps>["holdings"]): Promise<
  ReturnType<typeof getDeps>["holdings"] extends {
    listByUser: (...args: never[]) => Promise<infer T>;
  }
    ? T
    : never[]
> {
  // TODO(v2): llamar repo.listAll() cuando exista, o repo.listByUser(OWNER_USER_ID).
  return [] as never;
}

/**
 * Recolecta todos los items del watchlist para pre-cache.
 * En v1 single-user retorna array vacío hasta que se agregue `listAll()`
 * o se configure `OWNER_USER_ID`.
 *
 * @returns Lista de items del watchlist a pre-cachear (vacía en v1).
 */
async function collectAllWatchlist(_repo: ReturnType<typeof getDeps>["watchlist"]): Promise<
  ReturnType<typeof getDeps>["watchlist"] extends {
    listByUser: (...args: never[]) => Promise<infer T>;
  }
    ? T
    : never[]
> {
  // TODO(v2): llamar repo.listAll() cuando exista, o repo.listByUser(OWNER_USER_ID).
  return [] as never;
}
