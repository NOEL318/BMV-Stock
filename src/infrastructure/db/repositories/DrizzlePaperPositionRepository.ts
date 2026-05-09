import { and, eq, isNull } from "drizzle-orm";

import type { PaperPosition } from "@/domain/entities/PaperPosition";
import type { PaperPositionRepository } from "@/domain/ports/PaperPositionRepository";
import type { Exchange } from "@/domain/value-objects/Ticker";

import type { Database } from "../client";
import { paperPositions, type DbPaperPosition } from "../schema";

/**
 * Persistencia de posiciones simuladas por portafolio paper.
 */
export class DrizzlePaperPositionRepository implements PaperPositionRepository {
  constructor(private readonly db: Database) {}

  /** Lista las posiciones del portafolio. Por default solo activas (closedAt null). */
  async listByPortfolio(
    paperPortfolioId: string,
    options?: { includeClosed?: boolean },
  ): Promise<PaperPosition[]> {
    const conditions = [eq(paperPositions.paperPortfolioId, paperPortfolioId)];
    if (!options?.includeClosed) {
      conditions.push(isNull(paperPositions.closedAt));
    }
    const rows = await this.db
      .select()
      .from(paperPositions)
      .where(and(...conditions));
    return rows.map((r) => this.toDomain(r));
  }

  /** Busca una posición por id. Regresa null si no existe. */
  async findById(id: string): Promise<PaperPosition | null> {
    const rows = await this.db
      .select()
      .from(paperPositions)
      .where(eq(paperPositions.id, id))
      .limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  /**
   * Busca por la combinación única de paperPortfolioId + ticker + exchange.
   * Necesita exchange porque un mismo símbolo puede existir en BMV y SIC.
   */
  async findByTickerAndExchange(
    paperPortfolioId: string,
    ticker: string,
    exchange: Exchange,
  ): Promise<PaperPosition | null> {
    const rows = await this.db
      .select()
      .from(paperPositions)
      .where(
        and(
          eq(paperPositions.paperPortfolioId, paperPortfolioId),
          eq(paperPositions.ticker, ticker),
          eq(paperPositions.exchange, exchange),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  /** Crea una nueva posición simulada. Asigna id y timestamps en DB. */
  async create(
    input: Omit<PaperPosition, "id" | "createdAt" | "updatedAt">,
  ): Promise<PaperPosition> {
    const [row] = await this.db
      .insert(paperPositions)
      .values({
        paperPortfolioId: input.paperPortfolioId,
        ticker: input.ticker,
        exchange: input.exchange,
        quantity: input.quantity.toString(),
        avgCostMxn: input.avgCostMxn.toString(),
        openedAt: input.openedAt,
        closedAt: input.closedAt,
      })
      .returning();
    if (!row) throw new Error("failed to create paper position");
    return this.toDomain(row);
  }

  /** Actualiza la posición después de aplicar un paper trade. */
  async update(position: PaperPosition): Promise<PaperPosition> {
    const [row] = await this.db
      .update(paperPositions)
      .set({
        quantity: position.quantity.toString(),
        avgCostMxn: position.avgCostMxn.toString(),
        closedAt: position.closedAt,
        updatedAt: new Date(),
      })
      .where(eq(paperPositions.id, position.id))
      .returning();
    if (!row) throw new Error(`paper position not found: ${position.id}`);
    return this.toDomain(row);
  }

  /**
   * Mapea fila de DB (numerics como strings) a entidad de dominio (numbers).
   */
  private toDomain(row: DbPaperPosition): PaperPosition {
    return {
      id: row.id,
      paperPortfolioId: row.paperPortfolioId,
      ticker: row.ticker,
      exchange: row.exchange,
      quantity: Number(row.quantity),
      avgCostMxn: Number(row.avgCostMxn),
      openedAt: row.openedAt,
      closedAt: row.closedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
