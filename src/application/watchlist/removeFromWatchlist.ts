import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";

/**
 * Elimina un item del watchlist por su id. Idempotente: si el id no existe
 * en la base de datos, la operación termina sin error.
 */
export async function removeFromWatchlist({
  id,
  repo,
}: {
  /** Id del `WatchlistItem` a eliminar. */
  id: string;
  repo: WatchlistRepository;
}): Promise<void> {
  await repo.delete(id);
}
