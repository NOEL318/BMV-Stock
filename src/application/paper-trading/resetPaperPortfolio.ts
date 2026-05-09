import type { PaperPortfolio } from "@/domain/entities/PaperPortfolio";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";

/** Argumentos del use case. */
export interface ResetPaperPortfolioArgs {
  userId: string;
  paperPortfolioRepo: PaperPortfolioRepository;
}

/**
 * Resetea el paper portfolio del usuario: borra positions y trades,
 * regresa cashBalance al initialBalance, marca resetAt = now.
 * Operación atómica delegada al repository.
 */
export async function resetPaperPortfolio({
  userId,
  paperPortfolioRepo,
}: ResetPaperPortfolioArgs): Promise<PaperPortfolio> {
  return paperPortfolioRepo.reset(userId);
}
