import type { QueryClient } from "@tanstack/react-query";

/**
 * Claves de query centralizadas. Tener un único lugar evita typos y facilita
 * invalidar el conjunto correcto de queries tras cada mutación.
 */
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  portfolio: ["portfolio"] as const,
  paperPortfolio: ["paper-portfolio"] as const,
  paperTrades: ["paper-trades"] as const,
  watchlist: ["watchlist"] as const,
  userPreferences: ["user-preferences"] as const,
};

/**
 * El dashboard (`["dashboard"]`) agrega portfolio, paper, watchlist y trades en
 * una sola respuesta. Por eso CUALQUIER mutación que afecte esos datos debe
 * invalidarlo también; de lo contrario el dashboard muestra datos viejos.
 */

/** Invalida lo afectado por registrar/editar un trade real. */
export async function invalidateAfterRealTrade(qc: QueryClient): Promise<void> {
  await Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.portfolio }),
    qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}

/** Invalida lo afectado por ejecutar un paper trade. */
export async function invalidateAfterPaperTrade(qc: QueryClient): Promise<void> {
  await Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.paperPortfolio }),
    qc.invalidateQueries({ queryKey: queryKeys.paperTrades }),
    qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}

/**
 * Invalida lo afectado por resetear el paper portfolio. El reset borra también
 * el historial de trades, así que hay que invalidar `paper-trades` (no solo
 * `paper-portfolio`).
 */
export async function invalidateAfterPaperReset(qc: QueryClient): Promise<void> {
  await invalidateAfterPaperTrade(qc);
}

/** Invalida lo afectado por agregar/quitar una emisora del watchlist. */
export async function invalidateAfterWatchlistChange(qc: QueryClient): Promise<void> {
  await Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.watchlist }),
    qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}
