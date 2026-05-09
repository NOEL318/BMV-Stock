import { NextResponse } from "next/server";

import { computeMACD, computeRSI, computeSMA } from "@/application/analysis/computeIndicators";
import { getDeps } from "@/application/di";
import { getHistoricalPrices } from "@/application/quotes/getHistoricalPrices";
import { getQuote } from "@/application/quotes/getQuote";
import type { TimeRange } from "@/domain/entities/HistoricalPrice";
import { DomainError } from "@/domain/errors/DomainError";
import { requireUserId } from "@/infrastructure/auth/clerk";

/** Rangos temporales válidos para el parámetro ?range=. Incluye intradía. */
const VALID_RANGES: readonly TimeRange[] = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1H",
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "1Y",
  "5Y",
  "ALL",
];

/**
 * GET /api/analysis/[ticker]?range=3M
 *
 * Devuelve quote actual, serie histórica e indicadores técnicos calculados
 * en el servidor (SMA20, SMA50, RSI14, MACD). Requiere sesión.
 */
export async function GET(req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  try {
    await requireUserId();
    const { ticker } = await params;
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get("range") ?? "3M";
    const range: TimeRange = VALID_RANGES.includes(rangeParam as TimeRange)
      ? (rangeParam as TimeRange)
      : "3M";

    const { marketData } = getDeps();
    const [quote, historical] = await Promise.all([
      getQuote({ provider: marketData, rawTicker: ticker }),
      getHistoricalPrices({ provider: marketData, rawTicker: ticker, range }),
    ]);

    const closes = historical.map((h) => h.close);
    const indicators = {
      sma20: computeSMA(closes, 20),
      sma50: computeSMA(closes, 50),
      rsi14: computeRSI(closes, 14),
      macd: computeMACD(closes),
    };

    return NextResponse.json({ quote, historical, indicators });
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
    console.error("/api/analysis/[ticker] GET error:", e);
    // Diagnóstico temporal: incluir mensaje y stack en la respuesta para
    // depurar errores en dev. Quitar `debug` antes de deploy a producción.
    const debug =
      e instanceof Error
        ? { message: e.message, stack: e.stack?.split("\n").slice(0, 5) }
        : { message: String(e) };
    return NextResponse.json({ error: "internal server error", debug }, { status: 500 });
  }
}
