import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { resetPaperPortfolio } from "@/application/paper-trading/resetPaperPortfolio";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError } from "@/lib/api-errors";

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
    return mapApiError(e, "/api/paper-trading/reset");
  }
}
