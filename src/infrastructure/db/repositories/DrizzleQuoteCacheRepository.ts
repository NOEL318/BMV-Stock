import { and, between, eq, sql } from "drizzle-orm";

import type { HistoricalPrice } from "@/domain/entities/HistoricalPrice";
import type { Quote } from "@/domain/entities/Quote";
import type { CachedQuote, QuoteCacheRepository } from "@/domain/ports/QuoteCacheRepository";
import type { Exchange } from "@/domain/value-objects/Ticker";

import type { Database } from "../client";
import { historicalPrice, quoteCache, type DbHistoricalPrice, type DbQuoteCache } from "../schema";

/**
 * Cache de cotizaciones y precios históricos. El TTL lo enforza el
 * CachedMarketDataProvider, no este repo: el repo solo lee y escribe.
 */
export class DrizzleQuoteCacheRepository implements QuoteCacheRepository {
  constructor(private readonly db: Database) {}

  /** Busca el último quote cacheado con su `fetchedAt`. Regresa null si no existe. */
  async findCached(ticker: string, exchange: Exchange): Promise<CachedQuote | null> {
    const rows = await this.db
      .select()
      .from(quoteCache)
      .where(and(eq(quoteCache.ticker, ticker), eq(quoteCache.exchange, exchange)))
      .limit(1);
    const row = rows[0];
    return row ? { quote: this.toQuote(row), fetchedAt: row.fetchedAt } : null;
  }

  /** Inserta o actualiza el quote en cache (key: ticker + exchange). */
  async upsert(quote: Quote): Promise<void> {
    await this.db
      .insert(quoteCache)
      .values({
        ticker: quote.ticker,
        exchange: quote.exchange,
        priceUsd: quote.priceUsd?.toString() ?? null,
        priceMxn: quote.priceMxn.toString(),
        openMxn: quote.openMxn.toString(),
        highMxn: quote.highMxn.toString(),
        lowMxn: quote.lowMxn.toString(),
        volume: quote.volume,
        asOf: quote.asOf,
      })
      .onConflictDoUpdate({
        target: [quoteCache.ticker, quoteCache.exchange],
        set: {
          priceUsd: quote.priceUsd?.toString() ?? null,
          priceMxn: quote.priceMxn.toString(),
          openMxn: quote.openMxn.toString(),
          highMxn: quote.highMxn.toString(),
          lowMxn: quote.lowMxn.toString(),
          volume: quote.volume,
          asOf: quote.asOf,
          fetchedAt: new Date(),
        },
      });
  }

  /**
   * Lista los precios históricos cacheados en un rango de fechas.
   * La columna `date` en Postgres es tipo DATE; Drizzle la devuelve como string YYYY-MM-DD.
   */
  async findHistorical(
    ticker: string,
    exchange: Exchange,
    fromDate: Date,
    toDate: Date,
  ): Promise<HistoricalPrice[]> {
    const rows = await this.db
      .select()
      .from(historicalPrice)
      .where(
        and(
          eq(historicalPrice.ticker, ticker),
          eq(historicalPrice.exchange, exchange),
          between(historicalPrice.date, this.toDateString(fromDate), this.toDateString(toDate)),
        ),
      );
    return rows.map((r) => this.toHistorical(r));
  }

  /**
   * Inserta o actualiza múltiples días de OHLCV en cache. Si una fecha ya
   * existe, se sobreescribe con el dato fresco (onConflictDoUpdate). Esto
   * corrige el último día, que pudo cachearse intradía con un OHLC incompleto
   * y debe completarse al cierre.
   */
  async upsertHistorical(prices: HistoricalPrice[]): Promise<void> {
    if (prices.length === 0) return;
    await this.db
      .insert(historicalPrice)
      .values(
        prices.map((p) => ({
          ticker: p.ticker,
          exchange: p.exchange,
          date: this.toDateString(p.date),
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume,
        })),
      )
      .onConflictDoUpdate({
        target: [historicalPrice.ticker, historicalPrice.exchange, historicalPrice.date],
        set: {
          open: sql`excluded.open`,
          high: sql`excluded.high`,
          low: sql`excluded.low`,
          close: sql`excluded.close`,
          volume: sql`excluded.volume`,
          fetchedAt: new Date(),
        },
      });
  }

  /**
   * Mapea fila de quote_cache (numerics como strings) a entidad Quote (numbers).
   */
  private toQuote(row: DbQuoteCache): Quote {
    return {
      ticker: row.ticker,
      exchange: row.exchange,
      priceMxn: Number(row.priceMxn),
      priceUsd: row.priceUsd !== null ? Number(row.priceUsd) : null,
      openMxn: Number(row.openMxn),
      highMxn: Number(row.highMxn),
      lowMxn: Number(row.lowMxn),
      volume: Number(row.volume),
      asOf: row.asOf,
    };
  }

  /**
   * Mapea fila de historical_price (date como string) a entidad HistoricalPrice.
   */
  private toHistorical(row: DbHistoricalPrice): HistoricalPrice {
    return {
      ticker: row.ticker,
      exchange: row.exchange,
      date: new Date(row.date),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: Number(row.volume),
    };
  }

  /**
   * Convierte un Date a formato YYYY-MM-DD que Postgres espera para columnas date.
   */
  private toDateString(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
