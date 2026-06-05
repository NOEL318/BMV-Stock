import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { recordRealTrade } from "@/application/portfolio/recordRealTrade";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError, parseJsonBody } from "@/lib/api-errors";
import { recordTradeSchema } from "@/lib/schemas/trade";

/**
 * POST /api/portfolio/trades
 *
 * Registra un trade real ejecutado en GBM+ y actualiza el holding asociado.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await parseJsonBody(req);
    const parsed = recordTradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { holdings, trades } = getDeps();
    const result = await recordRealTrade({
      input: { userId, ...parsed.data },
      tradeRepo: trades,
      holdingRepo: holdings,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return mapApiError(e, "/api/portfolio/trades");
  }
}

/**
 * GET /api/portfolio/trades
 *
 * Lista todos los trades del usuario, ordenados por fecha de ejecución desc.
 */
export async function GET() {
  try {
    const userId = await requireUserId();
    const { trades } = getDeps();
    const list = await trades.listByUser(userId);
    return NextResponse.json({ trades: list });
  } catch (e) {
    return mapApiError(e, "/api/portfolio/trades GET");
  }
}
