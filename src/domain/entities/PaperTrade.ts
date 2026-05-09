import type { Exchange } from "../value-objects/Ticker";

/**
 * Acciones permitidas en paper trading. No hay DIVIDEND (no se simulan dividendos en v1).
 */
export type PaperTradeAction = "BUY" | "SELL";

/**
 * Trade simulado en el portafolio paper. Sin comisión.
 */
export interface PaperTrade {
  id: string;
  paperPortfolioId: string;
  ticker: string;
  exchange: Exchange;
  action: PaperTradeAction;
  quantity: number;
  priceMxn: number;
  executedAt: Date;
  notes: string | null;
  createdAt: Date;
}
