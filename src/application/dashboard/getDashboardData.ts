import {
  getPaperPortfolio,
  type PaperPortfolioState,
} from "@/application/paper-trading/getPaperPortfolio";
import { computePortfolioMetrics } from "@/application/portfolio/computePortfolioMetrics";
import { getHoldings, type HoldingWithQuote } from "@/application/portfolio/getHoldings";
import {
  getWatchlistWithQuotes,
  type WatchlistEntry,
} from "@/application/watchlist/getWatchlistWithQuotes";
import type { Trade } from "@/domain/entities/Trade";
import type { HoldingRepository } from "@/domain/ports/HoldingRepository";
import type { MarketDataProvider, MarketSnapshot } from "@/domain/ports/MarketDataProvider";
import type { PaperPortfolioRepository } from "@/domain/ports/PaperPortfolioRepository";
import type { PaperPositionRepository } from "@/domain/ports/PaperPositionRepository";
import type { TradeRepository } from "@/domain/ports/TradeRepository";
import type { WatchlistRepository } from "@/domain/ports/WatchlistRepository";

/**
 * Estructura de datos que el dashboard necesita en una sola respuesta.
 */
export interface DashboardData {
  marketSnapshot: MarketSnapshot;
  portfolio: {
    holdings: HoldingWithQuote[];
    metrics: ReturnType<typeof computePortfolioMetrics>;
  };
  /** Estado del paper portfolio; null si el usuario aún no ha inicializado uno. */
  paperPortfolio: PaperPortfolioState | null;
  watchlist: WatchlistEntry[];
  /** Últimos 10 trades reales del usuario. */
  recentTrades: Trade[];
}

/**
 * Argumentos del use case `getDashboardData`.
 */
export interface GetDashboardDataArgs {
  userId: string;
  holdingRepo: HoldingRepository;
  tradeRepo: TradeRepository;
  paperPortfolioRepo: PaperPortfolioRepository;
  paperPositionRepo: PaperPositionRepository;
  watchlistRepo: WatchlistRepository;
  marketData: MarketDataProvider;
}

/** Snapshot de mercado vacío usado cuando el proveedor falla. */
function emptySnapshot(): MarketSnapshot {
  const empty = (ticker: string, exchange: "BMV" | "SIC") => ({
    ticker,
    exchange,
    priceMxn: 0,
    priceUsd: null as number | null,
    openMxn: 0,
    highMxn: 0,
    lowMxn: 0,
    volume: 0,
    asOf: new Date(),
  });
  return {
    ipc: empty("IPC", "BMV"),
    usdMxn: empty("USDMXN", "SIC"),
    sp500: empty("SPX", "SIC"),
    nasdaq: empty("IXIC", "SIC"),
  };
}

/**
 * Agrega todos los datos que el dashboard necesita en una sola llamada.
 * Dispara las 5 queries en paralelo con `Promise.allSettled` para tolerar
 * fallos parciales (por ejemplo, snapshot de mercado caído). Cada sección
 * tiene un valor de fallback para que la UI no truene.
 */
export async function getDashboardData({
  userId,
  holdingRepo,
  tradeRepo,
  paperPortfolioRepo,
  paperPositionRepo,
  watchlistRepo,
  marketData,
}: GetDashboardDataArgs): Promise<DashboardData> {
  // Disparar todas las queries en paralelo.
  const [holdingsResult, paperPortfolioResult, watchlistResult, snapshotResult, tradesResult] =
    await Promise.allSettled([
      getHoldings({ userId, holdingRepo, marketData }),
      getPaperPortfolio({ userId, paperPortfolioRepo, paperPositionRepo, marketData }),
      getWatchlistWithQuotes({ userId, repo: watchlistRepo, marketData }),
      marketData.getMarketSnapshot(),
      tradeRepo.listByUser(userId).then((all) => all.slice(0, 10)),
    ]);

  // Extraer valores o usar fallbacks según el resultado de cada promise.
  const holdings = holdingsResult.status === "fulfilled" ? holdingsResult.value : [];
  const paperPortfolio =
    paperPortfolioResult.status === "fulfilled" ? paperPortfolioResult.value : null;
  const watchlist = watchlistResult.status === "fulfilled" ? watchlistResult.value : [];
  const recentTrades = tradesResult.status === "fulfilled" ? tradesResult.value : [];

  // Si el snapshot falla, usar uno vacío para que la UI no truene.
  const marketSnapshot: MarketSnapshot =
    snapshotResult.status === "fulfilled" ? snapshotResult.value : emptySnapshot();

  return {
    marketSnapshot,
    portfolio: { holdings, metrics: computePortfolioMetrics(holdings) },
    paperPortfolio,
    watchlist,
    recentTrades,
  };
}
