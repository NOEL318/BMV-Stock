import type { Trade } from "../entities/Trade";

/**
 * Persistencia de trades reales. Los trades son inmutables, por eso no hay update.
 */
export interface TradeRepository {
  listByUser(userId: string): Promise<Trade[]>;
  findById(id: string): Promise<Trade | null>;
  create(input: Omit<Trade, "id" | "createdAt">): Promise<Trade>;
}
