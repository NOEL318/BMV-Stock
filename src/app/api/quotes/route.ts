import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { getQuote } from "@/application/quotes/getQuote";
import { DomainError } from "@/domain/errors/DomainError";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { quoteQuerySchema } from "@/lib/schemas/quote";

/**
 * GET /api/quotes?ticker=WALMEX.MX
 *
 * Regresa la cotización actual del ticker. Requiere sesión.
 */
export async function GET(req: Request) {
  try {
    await requireUserId();
    const url = new URL(req.url);
    const parsed = quoteQuerySchema.safeParse({ ticker: url.searchParams.get("ticker") });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid query", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { marketData } = getDeps();
    const quote = await getQuote({ provider: marketData, rawTicker: parsed.data.ticker });
    return NextResponse.json(quote);
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof DomainError) {
      const status =
        e.code === "TICKER_NOT_FOUND"
          ? 404
          : e.code === "INVALID_TICKER"
            ? 400
            : e.code === "MARKET_DATA_UNAVAILABLE"
              ? 503
              : 500;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("/api/quotes error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
