import type { PaperPosition } from "../entities/PaperPosition";
import type { Exchange } from "../value-objects/Ticker";

/**
 * Persistencia de posiciones simuladas del portafolio paper.
 */
export interface PaperPositionRepository {
  listByPortfolio(
    paperPortfolioId: string,
    options?: { includeClosed?: boolean },
  ): Promise<PaperPosition[]>;
  findById(id: string): Promise<PaperPosition | null>;
  findByTickerAndExchange(
    paperPortfolioId: string,
    ticker: string,
    exchange: Exchange,
  ): Promise<PaperPosition | null>;
  create(input: Omit<PaperPosition, "id" | "createdAt" | "updatedAt">): Promise<PaperPosition>;
  update(position: PaperPosition): Promise<PaperPosition>;
}
