import type { WatchlistItem } from "../entities/WatchlistItem";
import type { Exchange } from "../value-objects/Ticker";

/**
 * Persistencia del watchlist del usuario.
 */
export interface WatchlistRepository {
  listByUser(userId: string): Promise<WatchlistItem[]>;
  findByTickerAndExchange(
    userId: string,
    ticker: string,
    exchange: Exchange,
  ): Promise<WatchlistItem | null>;
  create(input: Omit<WatchlistItem, "id" | "addedAt">): Promise<WatchlistItem>;
  update(item: WatchlistItem): Promise<WatchlistItem>;
  delete(id: string): Promise<void>;
}
