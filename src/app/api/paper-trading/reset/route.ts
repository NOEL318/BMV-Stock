import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { resetPaperPortfolio } from "@/application/paper-trading/resetPaperPortfolio";
import { DomainError } from "@/domain/errors/DomainError";
import { requireUserId } from "@/infrastructure/auth/clerk";

/**
 * POST /api/paper-trading/reset
 *
 * Resetea el paper portfolio del usuario al saldo inicial, borrando todas
 * las positions y trades.
 */
export async function POST() {
  try {
    const userId = await requireUserId();
    const { paperPortfolio } = getDeps();
    const portfolio = await resetPaperPortfolio({
      userId,
      paperPortfolioRepo: paperPortfolio,
    });
    return NextResponse.json({ portfolio });
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof DomainError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    console.error("/api/paper-trading/reset error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
