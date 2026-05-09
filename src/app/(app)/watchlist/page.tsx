import { WatchlistPageClient } from "./WatchlistPageClient";

/**
 * Página de Watchlist — emisoras seguidas con cotización actual.
 */
export default function WatchlistPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
        <p className="text-muted-foreground text-sm">
          Emisoras que sigues con su cotización actual.
        </p>
      </div>
      <WatchlistPageClient />
    </div>
  );
}
