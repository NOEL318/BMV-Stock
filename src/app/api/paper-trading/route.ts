import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { getPaperPortfolio } from "@/application/paper-trading/getPaperPortfolio";
import { DomainError } from "@/domain/errors/DomainError";
import { requireUserId } from "@/infrastructure/auth/clerk";

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
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof DomainError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    console.error("/api/paper-trading error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
