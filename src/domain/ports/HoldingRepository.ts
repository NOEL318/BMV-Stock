import type { Holding } from "../entities/Holding";
import type { Exchange } from "../value-objects/Ticker";

/**
 * Persistencia de holdings (posiciones reales). El `update` reemplaza el
 * holding completo después de aplicar un trade.
 */
export interface HoldingRepository {
  /** Lista los holdings del usuario. Por default solo activos (closedAt null). */
  listByUser(userId: string, options?: { includeClosed?: boolean }): Promise<Holding[]>;
  findById(id: string): Promise<Holding | null>;
  /**
   * Busca por la combinación única de userId + ticker + exchange.
   * Necesita exchange porque un mismo símbolo puede existir teóricamente en
   * BMV y SIC distintamente.
   */
  findByTickerAndExchange(
    userId: string,
    ticker: string,
    exchange: Exchange,
  ): Promise<Holding | null>;
  /** Crea un holding nuevo. Asigna id y timestamps. */
  create(input: Omit<Holding, "id" | "createdAt" | "updatedAt">): Promise<Holding>;
  /** Reemplaza el holding después de aplicar un trade. */
  update(holding: Holding): Promise<Holding>;
}
