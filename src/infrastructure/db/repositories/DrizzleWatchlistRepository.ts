import { and, eq } from "drizzle-orm";

import type { WatchlistItem } from "@/domain/entities/WatchlistItem";
import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";
import type { Exchange } from "@/domain/value-objects/Ticker";

import type { Database } from "../client";
import { watchlistItems, type DbWatchlistItem } from "../schema";

/**
 * Persistencia del watchlist de un usuario.
 */
export class DrizzleWatchlistRepository implements WatchlistRepository {
  constructor(private readonly db: Database) {}

  /** Lista todos los items del watchlist del usuario, ordenados por fecha de alta. */
  async listByUser(userId: string): Promise<WatchlistItem[]> {
    const rows = await this.db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, userId))
      .orderBy(watchlistItems.addedAt);
    return rows.map((r) => this.toDomain(r));
  }

  /**
   * Busca por la combinación única de userId + ticker + exchange.
   * Necesita exchange porque un mismo símbolo puede existir en BMV y SIC.
   */
  async findByTickerAndExchange(
    userId: string,
    ticker: string,
    exchange: Exchange,
  ): Promise<WatchlistItem | null> {
    const rows = await this.db
      .select()
      .from(watchlistItems)
      .where(
        and(
          eq(watchlistItems.userId, userId),
          eq(watchlistItems.ticker, ticker),
          eq(watchlistItems.exchange, exchange),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  /** Agrega un ticker al watchlist. Asigna id y addedAt en DB. */
  async create(input: Omit<WatchlistItem, "id" | "addedAt">): Promise<WatchlistItem> {
    const [row] = await this.db
      .insert(watchlistItems)
      .values({
        userId: input.userId,
        ticker: input.ticker,
        exchange: input.exchange,
        alertPriceAbove: input.alertPriceAbove?.toString() ?? null,
        alertPriceBelow: input.alertPriceBelow?.toString() ?? null,
        notes: input.notes,
      })
      .returning();
    if (!row) throw new Error("failed to create watchlist item");
    return this.toDomain(row);
  }

  /** Actualiza los campos de alerta y notas de un item del watchlist. */
  async update(item: WatchlistItem): Promise<WatchlistItem> {
    const [row] = await this.db
      .update(watchlistItems)
      .set({
        alertPriceAbove: item.alertPriceAbove?.toString() ?? null,
        alertPriceBelow: item.alertPriceBelow?.toString() ?? null,
        notes: item.notes,
      })
      .where(eq(watchlistItems.id, item.id))
      .returning();
    if (!row) throw new Error(`watchlist item not found: ${item.id}`);
    return this.toDomain(row);
  }

  /** Elimina un item del watchlist por id, acotado al usuario dueño. */
  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .delete(watchlistItems)
      .where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)));
  }

  /**
   * Mapea fila de DB (numerics como strings) a entidad de dominio (numbers).
   */
  private toDomain(row: DbWatchlistItem): WatchlistItem {
    return {
      id: row.id,
      userId: row.userId,
      ticker: row.ticker,
      exchange: row.exchange,
      alertPriceAbove: row.alertPriceAbove !== null ? Number(row.alertPriceAbove) : null,
      alertPriceBelow: row.alertPriceBelow !== null ? Number(row.alertPriceBelow) : null,
      notes: row.notes,
      addedAt: row.addedAt,
    };
  }
}
