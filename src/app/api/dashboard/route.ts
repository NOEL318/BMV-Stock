import { NextResponse } from "next/server";

import { getDashboardData } from "@/application/dashboard/getDashboardData";
import { getDeps } from "@/application/di";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError } from "@/lib/api-errors";

/**
 * GET /api/dashboard
 *
 * Agrega en una sola llamada: snapshot de mercado, resumen del portafolio real,
 * paper portfolio, watchlist mini y últimos trades. Requiere sesión.
 */
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
    return mapApiError(e, "/api/dashboard GET");
  }
}
