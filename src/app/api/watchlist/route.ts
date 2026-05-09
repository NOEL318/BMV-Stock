import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { addToWatchlist } from "@/application/watchlist/addToWatchlist";
import { getWatchlistWithQuotes } from "@/application/watchlist/getWatchlistWithQuotes";
import { DomainError } from "@/domain/errors/DomainError";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { addToWatchlistSchema } from "@/lib/schemas/watchlist";

/**
 * GET /api/watchlist — lista los items del watchlist del usuario con cotizaciones.
 */
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

/**
 * POST /api/watchlist — agrega una emisora al watchlist. Regresa 201 con el item creado.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body: unknown = await req.json();
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

/** Mapea errores de dominio y autenticación a respuestas HTTP apropiadas. */
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
