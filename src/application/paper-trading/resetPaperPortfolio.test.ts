import { describe, expect, it, vi } from "vitest";

import type { PaperPortfolio } from "@/domain/entities/PaperPortfolio";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";

import { resetPaperPortfolio } from "./resetPaperPortfolio";

describe("resetPaperPortfolio", () => {
  it("delega al repo y devuelve el portfolio reseteado", async () => {
    const resetted: PaperPortfolio = {
      id: "pp1",
      userId: "u1",
      name: "Mi paper",
      cashBalanceMxn: 100_000,
      initialBalanceMxn: 100_000,
      createdAt: new Date("2026-01-01"),
      resetAt: new Date(),
    };
    const paperPortfolioRepo: PaperPortfolioRepository = {
      findByUser: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      reset: vi.fn().mockResolvedValue(resetted),
    };

    const result = await resetPaperPortfolio({ userId: "u1", paperPortfolioRepo });

    expect(paperPortfolioRepo.reset).toHaveBeenCalledWith("u1");
    expect(result).toEqual(resetted);
    expect(result.cashBalanceMxn).toBe(result.initialBalanceMxn);
    expect(result.resetAt).not.toBeNull();
  });
});
