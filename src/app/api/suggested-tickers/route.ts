import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { getSuggestedTickersData } from "@/application/suggestions/getSuggestedTickersData";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError } from "@/lib/api-errors";

/**
 * GET /api/suggested-tickers
 *
 * Regresa la lista estática de tickers sugeridos, cada uno con su quote
 * actual y los cierres del último mes para dibujar una sparkline.
 * Requiere sesión.
 */
export async function GET() {
  try {
    await requireUserId();
    const { marketData } = getDeps();
    const entries = await getSuggestedTickersData({ marketData });
    return NextResponse.json({ entries });
  } catch (e) {
    return mapApiError(e, "/api/suggested-tickers");
  }
}
