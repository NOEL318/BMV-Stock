import { applyTradeToHolding, createHoldingFromBuy, type Holding } from "@/domain/entities/Holding";
import type { Trade, TradeAction } from "@/domain/entities/Trade";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";
import type { TradeRepository } from "@/domain/ports/TradeRepository";
import type { Exchange } from "@/domain/value-objects/Ticker";

/**
 * Input para registrar un trade real.
 * Es el body validado del endpoint POST /api/portfolio/trades.
 */
export interface RecordRealTradeInput {
  userId: string;
  ticker: string;
  exchange: Exchange;
  action: TradeAction;
  quantity: number;
  priceMxn: number;
  commissionMxn: number;
  executedAt: Date;
  notes: string | null;
}

/**
 * Argumentos del use case.
 */
export interface RecordRealTradeArgs {
  input: RecordRealTradeInput;
  tradeRepo: TradeRepository;
  holdingRepo: HoldingRepository;
}

/**
 * Resultado: el trade insertado y el holding resultante.
 */
export interface RecordRealTradeResult {
  trade: Trade;
  holding: Holding;
}

/**
 * Registra un trade real ejecutado por el usuario en GBM+ y actualiza el
 * holding correspondiente.
 *
 * Reglas:
 * - BUY sin holding previo: crea holding nuevo con `createHoldingFromBuy`.
 * - BUY sobre holding existente: aplica `applyTradeToHolding`, recalcula avgCost.
 * - SELL: requiere holding existente; lanza error si no hay. Lanza
 *   `InsufficientQuantityError` si la cantidad excede.
 * - DIVIDEND: registra el trade pero no muta el holding.
 *
 * @throws Error si SELL sin holding previo
 * @throws InsufficientQuantityError si SELL excede la cantidad disponible
 */
export async function recordRealTrade({
  input,
  tradeRepo,
  holdingRepo,
}: RecordRealTradeArgs): Promise<RecordRealTradeResult> {
  // Insertar el trade primero — es la fuente de verdad.
  const trade = await tradeRepo.create(input);
  const existing = await holdingRepo.findByTickerAndExchange(
    input.userId,
    input.ticker,
    input.exchange,
  );
  let holding: Holding;
  if (input.action === "BUY" && !existing) {
    const created = await holdingRepo.create(createHoldingFromBuy(trade));
    holding = created;
  } else if (input.action === "BUY" && existing) {
    holding = await holdingRepo.update(applyTradeToHolding(existing, trade));
  } else if (input.action === "SELL") {
    if (!existing) {
      throw new Error(`no existing holding to sell ${input.ticker} (${input.exchange})`);
    }
    holding = await holdingRepo.update(applyTradeToHolding(existing, trade));
  } else {
    // DIVIDEND
    if (!existing) {
      // Permitido sin holding (dividendo de posición ya cerrada). En ese caso
      // simplemente registramos el trade sin afectar holdings.
      holding = {
        id: "",
        userId: input.userId,
        ticker: input.ticker,
        exchange: input.exchange,
        quantity: 0,
        avgCostMxn: 0,
        openedAt: input.executedAt,
        closedAt: input.executedAt,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      holding = existing;
    }
  }
  return { trade, holding };
}
