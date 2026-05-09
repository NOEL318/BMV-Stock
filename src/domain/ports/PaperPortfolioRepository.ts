import type { PaperPortfolio } from "../entities/PaperPortfolio";

/**
 * Persistencia del portafolio paper. Un solo registro por usuario en v1.
 */
export interface PaperPortfolioRepository {
  findByUser(userId: string): Promise<PaperPortfolio | null>;
  create(input: Omit<PaperPortfolio, "id" | "createdAt">): Promise<PaperPortfolio>;
  update(portfolio: PaperPortfolio): Promise<PaperPortfolio>;
  /**
   * Resetea el portafolio: regresa cashBalance a initialBalance, borra
   * paper_positions y paper_trades del portfolio (en transacción), y
   * actualiza resetAt al timestamp actual.
   */
  reset(userId: string): Promise<PaperPortfolio>;
}
