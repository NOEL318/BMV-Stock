import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { computePortfolioMetrics } from "@/application/portfolio/computePortfolioMetrics";
import { getHoldings } from "@/application/portfolio/getHoldings";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError } from "@/lib/api-errors";

/**
 * GET /api/portfolio
 *
 * Regresa los holdings del usuario con cotizaciones actuales y métricas
 * agregadas. Requiere sesión.
 */
export async function GET() {
  try {
    const userId = await requireUserId();
    const { holdings, marketData } = getDeps();
    const enriched = await getHoldings({ userId, holdingRepo: holdings, marketData });
    const metrics = computePortfolioMetrics(enriched);
    return NextResponse.json({ holdings: enriched, metrics });
  } catch (e) {
    return mapApiError(e, "/api/portfolio");
  }
}
