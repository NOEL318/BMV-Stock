import type { Exchange } from "../value-objects/Ticker";

/**
 * Item en el watchlist del usuario. Los campos `alertPriceAbove` y `alertPriceBelow`
 * son v2 (la lógica de notificación no existe en v1).
 */
export interface WatchlistItem {
  id: string;
  userId: string;
  ticker: string;
  exchange: Exchange;
  alertPriceAbove: number | null;
  alertPriceBelow: number | null;
  notes: string | null;
  addedAt: Date;
}
