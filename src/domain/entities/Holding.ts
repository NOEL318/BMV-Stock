import { InsufficientQuantityError } from "../errors/DomainError";
import type { Exchange } from "../value-objects/Ticker";

import type { Trade } from "./Trade";

/**
 * Posición real actual del usuario en una emisora.
 * Vista derivada de la suma de Trades; el sistema la mantiene actualizada
 * tras ejecutar cada trade.
 */
export interface Holding {
  id: string;
  userId: string;
  ticker: string;
  exchange: Exchange;
  /** Cantidad actual. Cuando llega a 0, el holding se marca con closedAt. */
  quantity: number;
  /** Costo promedio por unidad en MXN, calculado como promedio ponderado. */
  avgCostMxn: number;
  /** Fecha del primer BUY que abrió esta posición. */
  openedAt: Date;
  /** Si quantity llegó a 0 por ventas, fecha del SELL que la cerró. */
  closedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Crea un Holding nuevo a partir de un trade BUY inicial.
 * El avgCost incluye la comisión prorrateada por unidad.
 *
 * @throws Error si el trade no es BUY
 */
export function createHoldingFromBuy(
  trade: Trade,
): Omit<Holding, "id" | "createdAt" | "updatedAt"> {
  if (trade.action !== "BUY") {
    throw new Error(`createHoldingFromBuy requires action=BUY, got ${trade.action}`);
  }
  const totalCost = trade.quantity * trade.priceMxn + trade.commissionMxn;
  return {
    userId: trade.userId,
    ticker: trade.ticker,
    exchange: trade.exchange,
    quantity: trade.quantity,
    avgCostMxn: totalCost / trade.quantity,
    openedAt: trade.executedAt,
    closedAt: null,
    notes: null,
  };
}

/**
 * Aplica un trade a un holding existente y devuelve el holding actualizado.
 * No muta el holding original.
 *
 * Reglas:
 * - BUY: avgCost se recalcula como promedio ponderado considerando la comisión.
 *   La cantidad aumenta.
 * - SELL: cantidad disminuye. avgCost no cambia. Si quantity llega a 0, se marca closedAt.
 *   Si trade.quantity excede holding.quantity, lanza InsufficientQuantityError.
 * - DIVIDEND: el holding no cambia.
 *
 * @throws InsufficientQuantityError si SELL excede la cantidad disponible
 */
export function applyTradeToHolding(holding: Holding, trade: Trade): Holding {
  switch (trade.action) {
    case "BUY": {
      const oldTotalCost = holding.quantity * holding.avgCostMxn;
      const tradeTotalCost = trade.quantity * trade.priceMxn + trade.commissionMxn;
      const newQuantity = holding.quantity + trade.quantity;
      const newAvgCost = (oldTotalCost + tradeTotalCost) / newQuantity;
      return {
        ...holding,
        quantity: newQuantity,
        avgCostMxn: newAvgCost,
        updatedAt: trade.executedAt,
      };
    }
    case "SELL": {
      if (trade.quantity > holding.quantity) {
        throw new InsufficientQuantityError(trade.quantity, holding.quantity);
      }
      const newQuantity = holding.quantity - trade.quantity;
      return {
        ...holding,
        quantity: newQuantity,
        closedAt: newQuantity === 0 ? trade.executedAt : holding.closedAt,
        updatedAt: trade.executedAt,
      };
    }
    case "DIVIDEND":
      return holding;
  }
}
