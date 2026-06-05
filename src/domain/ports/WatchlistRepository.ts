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
  /**
   * Elimina un item por id, acotado al `userId` dueño. El scoping por usuario
   * evita borrados cross-user (IDOR): un id que pertenezca a otro usuario no
   * se borra. Idempotente: si no existe el par (id, userId) no hace nada.
   */
  delete(id: string, userId: string): Promise<void>;
}
