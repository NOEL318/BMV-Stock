import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { getQuote } from "@/application/quotes/getQuote";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError } from "@/lib/api-errors";
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
    return mapApiError(e, "/api/quotes");
  }
}
