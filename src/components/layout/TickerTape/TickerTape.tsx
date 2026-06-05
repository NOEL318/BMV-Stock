"use client";

import Link from "next/link";

import type { SuggestedTickerData } from "@/application/suggestions/getSuggestedTickersData";
import { useSuggestedTickers } from "@/hooks/useSuggestedTickers";
import { cn } from "@/lib/utils";

/**
 * Marquee horizontal estilo "ticker tape" de Wall Street: muestra los
 * tickers populares con su precio y cambio del último mes en una banda
 * que se desplaza continuamente. Pausa al hacer hover.
 *
 * Renderiza dos copias del contenido para producir el loop sin "saltos".
 * Si no hay datos cargados, no se renderiza (mejor que mostrar marquee vacío).
 */
export function TickerTape() {
  const { data } = useSuggestedTickers();
  const entries = data?.entries ?? [];

  if (entries.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-border bg-card relative flex w-full overflow-hidden border-b",
        "[--ticker-tape-duration:80s]",
      )}
      aria-label="Banda de cotizaciones"
      role="marquee"
    >
      <div className="ticker-tape-track flex shrink-0 items-center gap-6 py-2 pl-6">
        {entries.map((entry) => (
          <TickerTapeItem key={`a-${entry.href}`} entry={entry} />
        ))}
      </div>
      <div className="ticker-tape-track flex shrink-0 items-center gap-6 py-2 pl-6" aria-hidden>
        {entries.map((entry) => (
          <TickerTapeItem key={`b-${entry.href}`} entry={entry} />
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .ticker-tape-track {
          animation: ticker-scroll var(--ticker-tape-duration) linear infinite;
        }
        :global(.ticker-tape:hover) .ticker-tape-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-tape-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Item individual del ticker tape: símbolo + precio + cambio % con flecha
 * y color según signo. Click navega al análisis.
 */
function TickerTapeItem({ entry }: { entry: SuggestedTickerData }) {
  const { ticker, exchange, href, quote, recentCloses } = entry;

  const firstClose = recentCloses[0] ?? null;
  const lastClose = recentCloses[recentCloses.length - 1] ?? null;
  const changePct =
    firstClose !== null && lastClose !== null && firstClose > 0
      ? (lastClose - firstClose) / firstClose
      : null;

  const colorClass =
    changePct === null
      ? "text-muted-foreground"
      : changePct >= 0
        ? "text-success"
        : "text-destructive";

  const arrow = changePct === null ? "•" : changePct >= 0 ? "▲" : "▼";

  const formattedPct =
    changePct === null ? null : `${changePct >= 0 ? "+" : ""}${(changePct * 100).toFixed(2)}%`;

  const formattedPrice = quote
    ? new Intl.NumberFormat("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(quote.priceMxn)
    : "—";

  return (
    <Link
      href={href}
      className="hover:bg-muted/50 inline-flex items-center gap-2 rounded px-1 py-0.5 font-mono text-xs whitespace-nowrap tabular-nums transition-colors"
      aria-label={`${ticker} ${exchange}: ${formattedPrice} MXN${formattedPct ? `, ${formattedPct}` : ""}`}
    >
      <span className="text-foreground font-semibold">{ticker}</span>
      <span className="text-muted-foreground text-[10px] uppercase">{exchange}</span>
      <span className="text-foreground">{formattedPrice}</span>
      {formattedPct !== null && (
        <span className={cn("inline-flex items-center gap-0.5", colorClass)}>
          <span aria-hidden>{arrow}</span>
          <span>{formattedPct}</span>
        </span>
      )}
    </Link>
  );
}
