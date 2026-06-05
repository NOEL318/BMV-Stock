import { and, eq, isNull } from "drizzle-orm";

import type { Holding } from "@/domain/entities/Holding";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";
import type { Exchange } from "@/domain/value-objects/Ticker";

import type { Database } from "../client";
import { holdings, type DbHolding } from "../schema";

/**
 * Implementación de HoldingRepository usando Drizzle + Neon.
 */
export class DrizzleHoldingRepository implements HoldingRepository {
  constructor(private readonly db: Database) {}

  /** Lista los holdings del usuario. Por default solo activos (closedAt null). */
  async listByUser(userId: string, options?: { includeClosed?: boolean }): Promise<Holding[]> {
    const conditions = [eq(holdings.userId, userId)];
    if (!options?.includeClosed) {
      conditions.push(isNull(holdings.closedAt));
    }
    const rows = await this.db
      .select()
      .from(holdings)
      .where(and(...conditions))
      .orderBy(holdings.ticker);
    return rows.map((r) => this.toDomain(r));
  }

  /** Busca un holding por id. Regresa null si no existe. */
  async findById(id: string): Promise<Holding | null> {
    const rows = await this.db.select().from(holdings).where(eq(holdings.id, id)).limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  /**
   * Busca por la combinación única de userId + ticker + exchange.
   * Necesita exchange porque un mismo símbolo puede existir en BMV y SIC.
   */
  async findByTickerAndExchange(
    userId: string,
    ticker: string,
    exchange: Exchange,
  ): Promise<Holding | null> {
    const rows = await this.db
      .select()
      .from(holdings)
      .where(
        and(
          eq(holdings.userId, userId),
          eq(holdings.ticker, ticker),
          eq(holdings.exchange, exchange),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  /** Crea un holding nuevo. Asigna id y timestamps en DB. */
  async create(input: Omit<Holding, "id" | "createdAt" | "updatedAt">): Promise<Holding> {
    const [row] = await this.db
      .insert(holdings)
      .values({
        userId: input.userId,
        ticker: input.ticker,
        exchange: input.exchange,
        quantity: input.quantity.toString(),
        avgCostMxn: input.avgCostMxn.toString(),
        openedAt: input.openedAt,
        closedAt: input.closedAt,
        notes: input.notes,
      })
      .returning();
    if (!row) throw new Error("failed to create holding");
    return this.toDomain(row);
  }

  /** Reemplaza el holding después de aplicar un trade. */
  async update(holding: Holding): Promise<Holding> {
    const [row] = await this.db
      .update(holdings)
      .set({
        quantity: holding.quantity.toString(),
        avgCostMxn: holding.avgCostMxn.toString(),
        closedAt: holding.closedAt,
        notes: holding.notes,
        updatedAt: new Date(),
      })
      .where(eq(holdings.id, holding.id))
      .returning();
    if (!row) throw new Error(`holding not found: ${holding.id}`);
    return this.toDomain(row);
  }

  /**
   * Mapea fila de DB (numerics como strings) a entidad de dominio (numbers).
   */
  private toDomain(row: DbHolding): Holding {
    return {
      id: row.id,
      userId: row.userId,
      ticker: row.ticker,
      exchange: row.exchange,
      quantity: Number(row.quantity),
      avgCostMxn: Number(row.avgCostMxn),
      openedAt: row.openedAt,
      closedAt: row.closedAt,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
