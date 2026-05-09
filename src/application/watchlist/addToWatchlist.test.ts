import { describe, expect, it, vi } from "vitest";

import type { WatchlistItem } from "@/domain/entities/WatchlistItem";
import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";

import { addToWatchlist } from "./addToWatchlist";

/** Item de watchlist de muestra para tests. */
const item1: WatchlistItem = {
  id: "wl1",
  userId: "u1",
  ticker: "WALMEX",
  exchange: "BMV",
  alertPriceAbove: null,
  alertPriceBelow: null,
  notes: null,
  addedAt: new Date(),
};

/** Repositorio mock con todos los métodos. */
function makeRepo(overrides: Partial<WatchlistRepository> = {}): WatchlistRepository {
  return {
    listByUser: vi.fn().mockResolvedValue([]),
    findByTickerAndExchange: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(item1),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

describe("addToWatchlist", () => {
  it("agrega nuevo item cuando no existe el ticker en el watchlist", async () => {
    const repo = makeRepo();
    const result = await addToWatchlist({
      input: { userId: "u1", rawTicker: "WALMEX.MX" },
      repo,
    });
    // Debe haber buscado y luego creado.
    expect(repo.findByTickerAndExchange).toHaveBeenCalledWith("u1", "WALMEX", "BMV");
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", ticker: "WALMEX", exchange: "BMV" }),
    );
    expect(result).toEqual(item1);
  });

  it("regresa el item existente sin crear duplicado", async () => {
    const repo = makeRepo({
      findByTickerAndExchange: vi.fn().mockResolvedValue(item1),
    });
    const result = await addToWatchlist({
      input: { userId: "u1", rawTicker: "WALMEX.MX" },
      repo,
    });
    expect(repo.create).not.toHaveBeenCalled();
    expect(result).toEqual(item1);
  });

  it("lanza error si el ticker es inválido", async () => {
    const repo = makeRepo();
    await expect(
      addToWatchlist({ input: { userId: "u1", rawTicker: "INVALID.US" }, repo }),
    ).rejects.toThrow();
    expect(repo.findByTickerAndExchange).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });
});
