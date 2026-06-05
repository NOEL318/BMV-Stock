import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { executePaperTrade } from "@/application/paper-trading/executePaperTrade";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError, parseJsonBody } from "@/lib/api-errors";
import { executePaperTradeSchema } from "@/lib/schemas/paperTrade";

/**
 * POST /api/paper-trading/trades
 *
 * Ejecuta un paper trade: valida fondos y cantidad, persiste el trade,
 * actualiza la posición y ajusta el cash del portfolio.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await parseJsonBody(req);
    const parsed = executePaperTradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { paperPortfolio, paperPosition, paperTrade, marketData } = getDeps();
    const result = await executePaperTrade({
      input: { userId, ...parsed.data },
      paperPortfolioRepo: paperPortfolio,
      paperPositionRepo: paperPosition,
      paperTradeRepo: paperTrade,
      marketData,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return mapApiError(e, "/api/paper-trading/trades");
  }
}

/**
 * GET /api/paper-trading/trades
 *
 * Lista los paper trades del usuario, ordenados por fecha desc.
 */
export async function GET() {
  try {
    const userId = await requireUserId();
    const { paperPortfolio, paperTrade } = getDeps();
    const portfolio = await paperPortfolio.findByUser(userId);
    if (!portfolio) {
      return NextResponse.json({ trades: [] });
    }
    const list = await paperTrade.listByPortfolio(portfolio.id);
    return NextResponse.json({ trades: list });
  } catch (e) {
    return mapApiError(e, "/api/paper-trading/trades GET");
  }
}
