import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { recordRealTrade } from "@/application/portfolio/recordRealTrade";
import { DomainError } from "@/domain/errors/DomainError";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { recordTradeSchema } from "@/lib/schemas/trade";

/**
 * POST /api/portfolio/trades
 *
 * Registra un trade real ejecutado en GBM+ y actualiza el holding asociado.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
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
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof DomainError) {
      const status = e.code === "INSUFFICIENT_QUANTITY" ? 422 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("/api/portfolio/trades error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
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
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("/api/portfolio/trades GET error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
