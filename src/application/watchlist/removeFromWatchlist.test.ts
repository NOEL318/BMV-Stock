import { describe, expect, it, vi } from "vitest";

import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";

import { removeFromWatchlist } from "./removeFromWatchlist";

describe("removeFromWatchlist", () => {
  it("delega la eliminación al repositorio con el id correcto", async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    const repo: WatchlistRepository = {
      listByUser: vi.fn(),
      findByTickerAndExchange: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: deleteFn,
    };
    await removeFromWatchlist({ id: "wl-42", repo });
    expect(deleteFn).toHaveBeenCalledOnce();
    expect(deleteFn).toHaveBeenCalledWith("wl-42");
  });
});
