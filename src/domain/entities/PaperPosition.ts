import type { Exchange } from "../value-objects/Ticker";

/**
 * Posición simulada actual en el portafolio paper.
 * Misma estructura conceptual que `Holding` pero ligada a un PaperPortfolio.
 */
export interface PaperPosition {
  id: string;
  paperPortfolioId: string;
  ticker: string;
  exchange: Exchange;
  quantity: number;
  avgCostMxn: number;
  openedAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
