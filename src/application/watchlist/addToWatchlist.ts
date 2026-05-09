import type { WatchlistItem } from "@/domain/entities/WatchlistItem";
import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";
import { Ticker } from "@/domain/value-objects/Ticker";

/**
 * Datos de entrada para agregar una emisora al watchlist.
 */
export interface AddToWatchlistInput {
  userId: string;
  /** Ticker en cualquier capitalización, con o sin sufijo `.MX`. */
  rawTicker: string;
  notes?: string | null;
  alertPriceAbove?: number | null;
  alertPriceBelow?: number | null;
}

/**
 * Agrega una emisora al watchlist del usuario. Si ya existe (mismo ticker
 * y exchange para el mismo usuario), regresa el existente sin crear duplicado.
 *
 * @throws Error si `rawTicker` no es un ticker válido.
 */
export async function addToWatchlist({
  input,
  repo,
}: {
  input: AddToWatchlistInput;
  repo: WatchlistRepository;
}): Promise<WatchlistItem> {
  // Valida y normaliza el ticker (lanza si es inválido).
  const ticker = Ticker.parse(input.rawTicker);

  // Idempotencia: si ya existe el par (userId, symbol, exchange) lo regresamos.
  const existing = await repo.findByTickerAndExchange(input.userId, ticker.symbol, ticker.exchange);
  if (existing) return existing;

  // Crear nuevo item en el repositorio.
  return repo.create({
    userId: input.userId,
    ticker: ticker.symbol,
    exchange: ticker.exchange,
    notes: input.notes ?? null,
    alertPriceAbove: input.alertPriceAbove ?? null,
    alertPriceBelow: input.alertPriceBelow ?? null,
  });
}
