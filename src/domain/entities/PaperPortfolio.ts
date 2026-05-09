import { InsufficientFundsError, InsufficientQuantityError } from "../errors/DomainError";

import type { PaperPosition } from "./PaperPosition";
import type { PaperTrade } from "./PaperTrade";

/**
 * Portafolio simulado del usuario. Un solo PaperPortfolio por usuario en v1.
 * cashBalanceMxn arranca en 100,000 (definido en el spec).
 */
export interface PaperPortfolio {
  id: string;
  userId: string;
  name: string;
  cashBalanceMxn: number;
  initialBalanceMxn: number;
  createdAt: Date;
  resetAt: Date | null;
}

/**
 * Resultado de aplicar un paper trade a un portfolio + posición.
 * El consumer (use case) decide cómo persistir.
 */
export interface PaperTradeOutcome {
  portfolio: PaperPortfolio;
  position: PaperPosition;
}

/**
 * Aplica un paper trade BUY al portfolio y a la posición existente (si la hay).
 * Si no hay posición previa, crea una nueva.
 *
 * Valida que cashBalanceMxn alcance para qty multiplicado por priceMxn.
 * Si no, lanza InsufficientFundsError. No muta los argumentos.
 */
export function applyPaperBuy(
  portfolio: PaperPortfolio,
  trade: PaperTrade,
  existing: PaperPosition | null,
): PaperTradeOutcome {
  if (trade.action !== "BUY") {
    throw new Error(`applyPaperBuy requires action=BUY, got ${trade.action}`);
  }
  const cost = trade.quantity * trade.priceMxn;
  if (portfolio.cashBalanceMxn < cost) {
    throw new InsufficientFundsError(cost, portfolio.cashBalanceMxn);
  }
  const updatedPortfolio: PaperPortfolio = {
    ...portfolio,
    cashBalanceMxn: portfolio.cashBalanceMxn - cost,
  };
  let position: PaperPosition;
  if (existing && existing.quantity > 0) {
    const oldTotalCost = existing.quantity * existing.avgCostMxn;
    const newQuantity = existing.quantity + trade.quantity;
    const newAvgCost = (oldTotalCost + cost) / newQuantity;
    position = {
      ...existing,
      quantity: newQuantity,
      avgCostMxn: newAvgCost,
      updatedAt: trade.executedAt,
    };
  } else {
    position = {
      id: existing?.id ?? "",
      paperPortfolioId: portfolio.id,
      ticker: trade.ticker,
      exchange: trade.exchange,
      quantity: trade.quantity,
      avgCostMxn: trade.priceMxn,
      openedAt: trade.executedAt,
      closedAt: null,
      createdAt: trade.executedAt,
      updatedAt: trade.executedAt,
    };
  }
  return { portfolio: updatedPortfolio, position };
}

/**
 * Aplica un paper trade SELL al portfolio y la posición.
 *
 * Valida que existing.quantity sea suficiente. Si no, lanza
 * InsufficientQuantityError. Aumenta cashBalanceMxn por qty multiplicado por
 * priceMxn (sin comisión). Si la cantidad llega a 0, la posición se marca
 * con closedAt.
 */
export function applyPaperSell(
  portfolio: PaperPortfolio,
  trade: PaperTrade,
  existing: PaperPosition,
): PaperTradeOutcome {
  if (trade.action !== "SELL") {
    throw new Error(`applyPaperSell requires action=SELL, got ${trade.action}`);
  }
  if (trade.quantity > existing.quantity) {
    throw new InsufficientQuantityError(trade.quantity, existing.quantity);
  }
  const proceeds = trade.quantity * trade.priceMxn;
  const newQuantity = existing.quantity - trade.quantity;
  return {
    portfolio: {
      ...portfolio,
      cashBalanceMxn: portfolio.cashBalanceMxn + proceeds,
    },
    position: {
      ...existing,
      quantity: newQuantity,
      closedAt: newQuantity === 0 ? trade.executedAt : existing.closedAt,
      updatedAt: trade.executedAt,
    },
  };
}
