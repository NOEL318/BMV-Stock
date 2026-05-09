import type { PaperTrade } from "../entities/PaperTrade";

/**
 * Persistencia de trades simulados. Los paper trades son inmutables, por eso no hay update.
 */
export interface PaperTradeRepository {
  listByPortfolio(paperPortfolioId: string): Promise<PaperTrade[]>;
  findById(id: string): Promise<PaperTrade | null>;
  create(input: Omit<PaperTrade, "id" | "createdAt">): Promise<PaperTrade>;
}
