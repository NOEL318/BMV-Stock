import { desc, eq } from "drizzle-orm";

import type { PaperTrade } from "@/domain/entities/PaperTrade";
import type { PaperTradeRepository } from "@/domain/ports/PaperTradeRepository";

import type { Database } from "../client";
import { paperTrades, type DbPaperTrade } from "../schema";

/**
 * Persistencia de trades simulados. Inmutables: no hay método update.
 */
export class DrizzlePaperTradeRepository implements PaperTradeRepository {
  constructor(private readonly db: Database) {}

  /** Lista los trades del portafolio paper ordenados por fecha descendente. */
  async listByPortfolio(paperPortfolioId: string): Promise<PaperTrade[]> {
    const rows = await this.db
      .select()
      .from(paperTrades)
      .where(eq(paperTrades.paperPortfolioId, paperPortfolioId))
      .orderBy(desc(paperTrades.executedAt));
    return rows.map((r) => this.toDomain(r));
  }

  /** Busca un paper trade por id. Regresa null si no existe. */
  async findById(id: string): Promise<PaperTrade | null> {
    const rows = await this.db.select().from(paperTrades).where(eq(paperTrades.id, id)).limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  /** Inserta un nuevo paper trade. Inmutable: no hay update. */
  async create(input: Omit<PaperTrade, "id" | "createdAt">): Promise<PaperTrade> {
    const [row] = await this.db
      .insert(paperTrades)
      .values({
        paperPortfolioId: input.paperPortfolioId,
        ticker: input.ticker,
        exchange: input.exchange,
        action: input.action,
        quantity: input.quantity.toString(),
        priceMxn: input.priceMxn.toString(),
        executedAt: input.executedAt,
        notes: input.notes,
      })
      .returning();
    if (!row) throw new Error("failed to create paper trade");
    return this.toDomain(row);
  }

  /**
   * Mapea fila de DB (numerics como strings) a entidad de dominio (numbers).
   */
  private toDomain(row: DbPaperTrade): PaperTrade {
    return {
      id: row.id,
      paperPortfolioId: row.paperPortfolioId,
      ticker: row.ticker,
      exchange: row.exchange,
      action: row.action,
      quantity: Number(row.quantity),
      priceMxn: Number(row.priceMxn),
      executedAt: row.executedAt,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }
}
