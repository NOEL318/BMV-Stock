import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { addToWatchlist } from "@/application/watchlist/addToWatchlist";
import { getWatchlistWithQuotes } from "@/application/watchlist/getWatchlistWithQuotes";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError, parseJsonBody } from "@/lib/api-errors";
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
    return mapApiError(e, "/api/watchlist GET");
  }
}

/**
 * POST /api/watchlist — agrega una emisora al watchlist. Regresa 201 con el item creado.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await parseJsonBody(req);
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
    return mapApiError(e, "/api/watchlist POST");
  }
}
