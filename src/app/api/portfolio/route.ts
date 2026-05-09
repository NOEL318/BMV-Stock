import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { computePortfolioMetrics } from "@/application/portfolio/computePortfolioMetrics";
import { getHoldings } from "@/application/portfolio/getHoldings";
import { DomainError } from "@/domain/errors/DomainError";
import { requireUserId } from "@/infrastructure/auth/clerk";

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
    return handleApiError(e, "/api/portfolio");
  }
}

function handleApiError(e: unknown, path: string): Response {
  if (e instanceof Error && (e as { status?: number }).status === 401) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (e instanceof DomainError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
  }
  console.error(`${path} error:`, e);
  return NextResponse.json({ error: "internal server error" }, { status: 500 });
}
