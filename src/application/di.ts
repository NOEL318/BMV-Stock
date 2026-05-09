/* eslint-disable import/no-restricted-paths -- di.ts es el composition root y necesita importar de infrastructure */
import { db } from "@/infrastructure/db/client";
import { DrizzleHoldingRepository } from "@/infrastructure/db/repositories/DrizzleHoldingRepository";
import { DrizzlePaperPortfolioRepository } from "@/infrastructure/db/repositories/DrizzlePaperPortfolioRepository";
import { DrizzlePaperPositionRepository } from "@/infrastructure/db/repositories/DrizzlePaperPositionRepository";
import { DrizzlePaperTradeRepository } from "@/infrastructure/db/repositories/DrizzlePaperTradeRepository";
import { DrizzleQuoteCacheRepository } from "@/infrastructure/db/repositories/DrizzleQuoteCacheRepository";
import { DrizzleTradeRepository } from "@/infrastructure/db/repositories/DrizzleTradeRepository";
import { DrizzleUserPreferencesRepository } from "@/infrastructure/db/repositories/DrizzleUserPreferencesRepository";
import { DrizzleWatchlistRepository } from "@/infrastructure/db/repositories/DrizzleWatchlistRepository";
import { CachedMarketDataProvider } from "@/infrastructure/market-data/CachedMarketDataProvider";
import { YahooMarketDataProvider } from "@/infrastructure/market-data/YahooMarketDataProvider";

/**
 * Composition root.
 * Las API routes y server components llaman a `getDeps()` para obtener
 * la cadena de dependencias ya armada. Single instance por proceso (singleton).
 */
let cachedDeps: ReturnType<typeof buildDeps> | null = null;

function buildDeps() {
  const quoteCache = new DrizzleQuoteCacheRepository(db);
  const yahoo = new YahooMarketDataProvider();
  const marketData = new CachedMarketDataProvider(yahoo, quoteCache);
  return {
    marketData,
    holdings: new DrizzleHoldingRepository(db),
    trades: new DrizzleTradeRepository(db),
    paperPortfolio: new DrizzlePaperPortfolioRepository(db),
    paperPosition: new DrizzlePaperPositionRepository(db),
    paperTrade: new DrizzlePaperTradeRepository(db),
    watchlist: new DrizzleWatchlistRepository(db),
    userPreferences: new DrizzleUserPreferencesRepository(db),
  };
}

/**
 * Devuelve la instancia compartida de dependencias.
 * Lazy: se construye en la primera llamada y se cachea para llamadas siguientes.
 */
export function getDeps() {
  cachedDeps ??= buildDeps();
  return cachedDeps;
}
