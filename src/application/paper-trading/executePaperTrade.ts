import {
  applyPaperBuy,
  applyPaperSell,
  type PaperPortfolio,
} from "@/domain/entities/PaperPortfolio";
import type { PaperPosition } from "@/domain/entities/PaperPosition";
import type { PaperTrade, PaperTradeAction } from "@/domain/entities/PaperTrade";
import type { MarketDataProvider } from "@/domain/ports/MarketDataProvider";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";
import type { PaperPositionRepository } from "@/domain/ports/PaperPositionRepository";
import type { PaperTradeRepository } from "@/domain/ports/PaperTradeRepository";
import type { Exchange } from "@/domain/value-objects/Ticker";
import { Ticker } from "@/domain/value-objects/Ticker";

/** Input del use case. */
export interface ExecutePaperTradeInput {
  userId: string;
  ticker: string;
  exchange: Exchange;
  action: PaperTradeAction;
  quantity: number;
  /** Si null, el use case usa el último precio del provider. */
  priceMxn: number | null;
  notes: string | null;
}

/** Argumentos del use case. */
export interface ExecutePaperTradeArgs {
  input: ExecutePaperTradeInput;
  paperPortfolioRepo: PaperPortfolioRepository;
  paperPositionRepo: PaperPositionRepository;
  paperTradeRepo: PaperTradeRepository;
  marketData: MarketDataProvider;
}

/** Resultado del use case. */
export interface ExecutePaperTradeResult {
  trade: PaperTrade;
  position: PaperPosition;
  portfolio: PaperPortfolio;
}

/**
 * Ejecuta un paper trade: valida fondos/cantidad, persiste el trade,
 * actualiza/crea la posición y ajusta `cashBalanceMxn` del portfolio.
 *
 * Si el caller no provee `priceMxn`, se usa el último precio del provider
 * (que generalmente es el cache de quote_cache si está fresco).
 *
 * @throws Error si el usuario no tiene paper portfolio
 * @throws InsufficientFundsError si BUY excede `cashBalanceMxn`
 * @throws InsufficientQuantityError si SELL excede la posición
 */
export async function executePaperTrade({
  input,
  paperPortfolioRepo,
  paperPositionRepo,
  paperTradeRepo,
  marketData,
}: ExecutePaperTradeArgs): Promise<ExecutePaperTradeResult> {
  const portfolio = await paperPortfolioRepo.findByUser(input.userId);
  if (!portfolio) {
    throw new Error(`paper portfolio not found for user ${input.userId}`);
  }

  // Resolver el precio: usar el provisto o consultar al provider.
  const ticker = Ticker.parse(input.exchange === "BMV" ? `${input.ticker}.MX` : input.ticker);
  const priceMxn = input.priceMxn ?? (await marketData.getQuote(ticker)).priceMxn;

  const existing = await paperPositionRepo.findByTickerAndExchange(
    portfolio.id,
    input.ticker,
    input.exchange,
  );

  // Construir el trade pendiente (todavía sin persistir — sin id ni createdAt).
  const pendingTrade: PaperTrade = {
    id: "",
    paperPortfolioId: portfolio.id,
    ticker: input.ticker,
    exchange: input.exchange,
    action: input.action,
    quantity: input.quantity,
    priceMxn,
    executedAt: new Date(),
    notes: input.notes,
    createdAt: new Date(),
  };

  // Aplicar la lógica de dominio para validar y calcular el outcome.
  const outcome =
    input.action === "BUY"
      ? applyPaperBuy(portfolio, pendingTrade, existing)
      : (() => {
          if (!existing) {
            throw new Error(`no existing paper position to sell ${input.ticker}`);
          }
          return applyPaperSell(portfolio, pendingTrade, existing);
        })();

  // Persistir: trade primero (inmutable), luego portfolio y position.
  const trade = await paperTradeRepo.create(pendingTrade);
  const updatedPortfolio = await paperPortfolioRepo.update(outcome.portfolio);
  const position =
    existing && existing.id !== ""
      ? await paperPositionRepo.update({ ...outcome.position, id: existing.id })
      : await paperPositionRepo.create(outcome.position);

  return { trade, portfolio: updatedPortfolio, position };
}
