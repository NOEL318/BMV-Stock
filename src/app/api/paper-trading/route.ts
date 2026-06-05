import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { getPaperPortfolio } from "@/application/paper-trading/getPaperPortfolio";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError } from "@/lib/api-errors";

/**
 * GET /api/paper-trading
 *
 * Regresa el estado completo del paper portfolio del usuario:
 * portfolio, positions con quote, métricas agregadas (equity total, retorno).
 * Si el usuario aún no tiene paper portfolio, regresa 404.
 */
export async function GET() {
  try {
    const userId = await requireUserId();
    const { paperPortfolio, paperPosition, marketData } = getDeps();
    const state = await getPaperPortfolio({
      userId,
      paperPortfolioRepo: paperPortfolio,
      paperPositionRepo: paperPosition,
      marketData,
    });
    if (!state) {
      return NextResponse.json({ error: "paper portfolio not found" }, { status: 404 });
    }
    return NextResponse.json(state);
  } catch (e) {
    return mapApiError(e, "/api/paper-trading");
  }
}
