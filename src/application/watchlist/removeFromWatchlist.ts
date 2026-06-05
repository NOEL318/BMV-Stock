import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";

/**
 * Elimina un item del watchlist por su id, acotado al `userId` dueño.
 * Idempotente: si el par (id, userId) no existe, la operación termina sin
 * error. El scoping por usuario evita borrados cross-user (IDOR).
 */
export async function removeFromWatchlist({
  id,
  userId,
  repo,
}: {
  /** Id del `WatchlistItem` a eliminar. */
  id: string;
  /** Id del usuario dueño; el borrado se acota a sus items. */
  userId: string;
  repo: WatchlistRepository;
}): Promise<void> {
  await repo.delete(id, userId);
}
