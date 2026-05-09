import { desc, eq } from "drizzle-orm";

import type { Trade } from "@/domain/entities/Trade";
import type { TradeRepository } from "@/domain/ports/TradeRepository";

import type { Database } from "../client";
import { trades, type DbTrade } from "../schema";

/**
 * Persistencia de trades reales. Inmutables: no hay método update.
 */
export class DrizzleTradeRepository implements TradeRepository {
  constructor(private readonly db: Database) {}

  /** Lista los trades del usuario ordenados por fecha descendente. */
  async listByUser(userId: string): Promise<Trade[]> {
    const rows = await this.db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.executedAt));
    return rows.map((r) => this.toDomain(r));
  }

  /** Busca un trade por id. Regresa null si no existe. */
  async findById(id: string): Promise<Trade | null> {
    const rows = await this.db.select().from(trades).where(eq(trades.id, id)).limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  /** Inserta un nuevo trade. Inmutable: no hay update. */
  async create(input: Omit<Trade, "id" | "createdAt">): Promise<Trade> {
    const [row] = await this.db
      .insert(trades)
      .values({
        userId: input.userId,
        ticker: input.ticker,
        exchange: input.exchange,
        action: input.action,
        quantity: input.quantity.toString(),
        priceMxn: input.priceMxn.toString(),
        commissionMxn: input.commissionMxn.toString(),
        executedAt: input.executedAt,
        notes: input.notes,
      })
      .returning();
    if (!row) throw new Error("failed to create trade");
    return this.toDomain(row);
  }

  /**
   * Mapea fila de DB (numerics como strings) a entidad de dominio (numbers).
   */
  private toDomain(row: DbTrade): Trade {
    return {
      id: row.id,
      userId: row.userId,
      ticker: row.ticker,
      exchange: row.exchange,
      action: row.action,
      quantity: Number(row.quantity),
      priceMxn: Number(row.priceMxn),
      commissionMxn: Number(row.commissionMxn),
      executedAt: row.executedAt,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }
}
