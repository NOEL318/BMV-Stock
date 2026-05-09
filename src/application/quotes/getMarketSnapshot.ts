import type { MarketDataProvider, MarketSnapshot } from "@/domain/ports/MarketDataProvider";

/**
 * Argumentos del use case getMarketSnapshot.
 */
export interface GetMarketSnapshotInput {
  provider: MarketDataProvider;
}

/**
 * Snapshot agregado de los benchmarks (IPC, USDMXN, S&P 500, NASDAQ)
 * que el dashboard muestra en su parte superior.
 */
export async function getMarketSnapshot({
  provider,
}: GetMarketSnapshotInput): Promise<MarketSnapshot> {
  return provider.getMarketSnapshot();
}
