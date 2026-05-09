import { eq } from "drizzle-orm";

import type { PaperPortfolio } from "@/domain/entities/PaperPortfolio";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";

import type { Database } from "../client";
import { paperPortfolios, paperPositions, paperTrades, type DbPaperPortfolio } from "../schema";

/**
 * Persistencia del portafolio paper. Un solo registro por usuario.
 */
export class DrizzlePaperPortfolioRepository implements PaperPortfolioRepository {
  constructor(private readonly db: Database) {}

  /** Busca el portafolio paper del usuario. Regresa null si no existe. */
  async findByUser(userId: string): Promise<PaperPortfolio | null> {
    const rows = await this.db
      .select()
      .from(paperPortfolios)
      .where(eq(paperPortfolios.userId, userId))
      .limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  /** Crea el portafolio paper inicial del usuario. */
  async create(input: Omit<PaperPortfolio, "id" | "createdAt">): Promise<PaperPortfolio> {
    const [row] = await this.db
      .insert(paperPortfolios)
      .values({
        userId: input.userId,
        name: input.name,
        cashBalanceMxn: input.cashBalanceMxn.toString(),
        initialBalanceMxn: input.initialBalanceMxn.toString(),
        resetAt: input.resetAt,
      })
      .returning();
    if (!row) throw new Error("failed to create paper portfolio");
    return this.toDomain(row);
  }

  /** Actualiza nombre o saldo del portafolio. */
  async update(portfolio: PaperPortfolio): Promise<PaperPortfolio> {
    const [row] = await this.db
      .update(paperPortfolios)
      .set({
        name: portfolio.name,
        cashBalanceMxn: portfolio.cashBalanceMxn.toString(),
        initialBalanceMxn: portfolio.initialBalanceMxn.toString(),
        resetAt: portfolio.resetAt,
      })
      .where(eq(paperPortfolios.id, portfolio.id))
      .returning();
    if (!row) throw new Error(`paper portfolio not found: ${portfolio.id}`);
    return this.toDomain(row);
  }

  /**
   * Resetea el portafolio: borra paper_positions y paper_trades del portfolio,
   * regresa cashBalanceMxn al initialBalanceMxn, y actualiza resetAt.
   *
   * NOTA: el driver neon-http no soporta transacciones interactivas (lanza
   * "No transactions support in neon-http driver"). Las tres operaciones se
   * ejecutan en secuencia. Si falla el DELETE o el UPDATE a mitad, la DB
   * puede quedar en estado inconsistente. Alternativa futura: migrar a
   * WebSocket driver de Neon para soporte de transacciones.
   */
  async reset(userId: string): Promise<PaperPortfolio> {
    // 1. Obtener el portafolio existente
    const existing = await this.db
      .select()
      .from(paperPortfolios)
      .where(eq(paperPortfolios.userId, userId))
      .limit(1);
    const portfolio = existing[0];
    if (!portfolio) throw new Error(`paper portfolio not found for user ${userId}`);

    // 2. Borrar trades simulados del portfolio
    await this.db.delete(paperTrades).where(eq(paperTrades.paperPortfolioId, portfolio.id));

    // 3. Borrar posiciones simuladas del portfolio
    await this.db.delete(paperPositions).where(eq(paperPositions.paperPortfolioId, portfolio.id));

    // 4. Restaurar el saldo al inicial y registrar la fecha de reset
    const [updated] = await this.db
      .update(paperPortfolios)
      .set({
        cashBalanceMxn: portfolio.initialBalanceMxn,
        resetAt: new Date(),
      })
      .where(eq(paperPortfolios.id, portfolio.id))
      .returning();
    if (!updated) throw new Error("failed to reset paper portfolio");
    return this.toDomain(updated);
  }

  /**
   * Mapea fila de DB (numerics como strings) a entidad de dominio (numbers).
   */
  private toDomain(row: DbPaperPortfolio): PaperPortfolio {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      cashBalanceMxn: Number(row.cashBalanceMxn),
      initialBalanceMxn: Number(row.initialBalanceMxn),
      createdAt: row.createdAt,
      resetAt: row.resetAt,
    };
  }
}
