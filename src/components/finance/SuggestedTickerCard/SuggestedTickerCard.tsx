"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { LuStar } from "react-icons/lu";
import { toast } from "sonner";

import { SparkLine } from "@/components/charts/SparkLine";
import { ExchangeBadge } from "@/components/finance/ExchangeBadge";
import { MoneyDisplay } from "@/components/finance/MoneyDisplay";
import { PnLBadge } from "@/components/finance/PnLBadge";
import { TickerBadge } from "@/components/finance/TickerBadge";
import { invalidateAfterWatchlistChange } from "@/hooks/invalidate";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";

import type { SuggestedTickerCardProps } from "./SuggestedTickerCard.types";

/**
 * Card compacta para mostrar una emisora sugerida con su precio actual,
 * el cambio del último mes, una sparkline y un botón para alternar su
 * presencia en el watchlist (estrella).
 *
 * Variantes:
 * - `vertical` (default): ticker arriba, precio en medio, sparkline abajo. Para grid.
 * - `horizontal`: ticker | precio | sparkline. Para scroll row tipo "Wall Street".
 *
 * Toda la card es link a `/analysis/<ticker>`. La estrella es un botón
 * separado que captura el click para no disparar la navegación.
 */
export function SuggestedTickerCard({
  data,
  layout = "vertical",
  className,
}: SuggestedTickerCardProps) {
  const { ticker, exchange, href, quote, recentCloses } = data;
  const queryClient = useQueryClient();
  const { data: watchlistData } = useWatchlist();
  const [pending, setPending] = useState(false);

  // Detectar si el ticker ya está en el watchlist (match exacto symbol + exchange).
  const watchlistEntry = watchlistData?.entries.find(
    (e) => e.item.ticker === ticker && e.item.exchange === exchange,
  );
  const inWatchlist = !!watchlistEntry;

  // Cambio del último mes (sparkline) — primer cierre vs último cierre.
  const firstClose = recentCloses[0] ?? null;
  const lastClose = recentCloses[recentCloses.length - 1] ?? null;
  const monthChangePct =
    firstClose !== null && lastClose !== null && firstClose > 0
      ? (lastClose - firstClose) / firstClose
      : null;
  const isPositive = monthChangePct !== null && monthChangePct >= 0;

  /**
   * Toggle del watchlist. Si la emisora ya está, llama DELETE; si no, POST.
   * Captura el click para no disparar la navegación de la card.
   */
  async function handleToggleWatchlist(e: React.MouseEvent): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      if (inWatchlist && watchlistEntry) {
        const res = await fetch(`/api/watchlist/${watchlistEntry.item.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          toast.error("Error al quitar del watchlist");
          return;
        }
        toast.success(`${ticker} fuera del watchlist`);
      } else {
        const tickerString = exchange === "BMV" ? `${ticker}.MX` : ticker;
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: tickerString }),
        });
        if (!res.ok) {
          toast.error("Error al agregar al watchlist");
          return;
        }
        toast.success(`${ticker} agregado al watchlist`);
      }
      await invalidateAfterWatchlistChange(queryClient);
    } finally {
      setPending(false);
    }
  }

  // Estrella reusable — colocada distinto según variante.
  const watchlistButton = (
    <button
      type="button"
      onClick={handleToggleWatchlist}
      disabled={pending}
      aria-label={inWatchlist ? "Quitar del watchlist" : "Agregar al watchlist"}
      aria-pressed={inWatchlist}
      className={cn(
        "hover:bg-muted z-10 inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        inWatchlist ? "text-yellow-500" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <LuStar className={cn("h-4 w-4", inWatchlist && "fill-yellow-500")} />
    </button>
  );

  if (layout === "horizontal") {
    return (
      <div
        className={cn(
          "group bg-card hover:border-primary/40 border-border relative flex shrink-0 items-center gap-3 overflow-hidden rounded-lg border p-3 transition-all hover:shadow-sm",
          className,
        )}
      >
        {/* El Link cubre el contenido; el botón va como hermano (no anidado en
            el anchor) para no producir HTML inválido (interactivo en interactivo). */}
        <Link
          href={href}
          aria-label={`Ver análisis de ${ticker}`}
          className="flex flex-1 items-center gap-3"
        >
          {/* Bloque ticker */}
          <div className="flex flex-col gap-1">
            <TickerBadge ticker={ticker} exchange={exchange} size="sm" />
            <ExchangeBadge exchange={exchange} size="sm" />
          </div>

          {/* Bloque precio + delta */}
          <div className="flex min-w-[5rem] flex-col items-end">
            {quote ? (
              <MoneyDisplay amount={quote.priceMxn} size="md" showCurrency={false} />
            ) : (
              <span className="text-muted-foreground text-xs">Sin datos</span>
            )}
            {monthChangePct !== null && (
              <PnLBadge percent={monthChangePct} percentFormat="decimal" size="sm" />
            )}
          </div>

          {/* Bloque sparkline */}
          <div className="min-w-[100px] flex-1">
            {recentCloses.length > 1 ? (
              <SparkLine data={recentCloses} width={140} height={36} className="w-full" />
            ) : (
              <span className="text-muted-foreground text-[10px]">Sin histórico</span>
            )}
          </div>
        </Link>

        {/* Botón watchlist en la esquina */}
        <div className="shrink-0">{watchlistButton}</div>
      </div>
    );
  }

  // Vertical (default) ----------------------------------------------------
  return (
    <div
      className={cn(
        "group bg-card hover:border-primary/40 border-border relative block overflow-hidden rounded-lg border transition-all hover:shadow-sm",
        className,
      )}
    >
      {/* Botón watchlist como hermano del Link (no anidado en el anchor). */}
      <div className="absolute top-1 right-1 z-10">{watchlistButton}</div>

      <Link href={href} aria-label={`Ver análisis de ${ticker}`} className="block">
        <div className="p-3">
          <div className="mb-2 flex items-start justify-between gap-2 pr-7">
            <div className="flex flex-col gap-1">
              <TickerBadge ticker={ticker} exchange={exchange} size="sm" />
              <ExchangeBadge exchange={exchange} size="sm" />
            </div>
            {monthChangePct !== null && (
              <PnLBadge percent={monthChangePct} percentFormat="decimal" size="sm" />
            )}
          </div>

          <div className="mb-2">
            {quote ? (
              <MoneyDisplay amount={quote.priceMxn} size="md" showCurrency={false} />
            ) : (
              <span className="text-muted-foreground text-xs">Sin datos</span>
            )}
            <div className="text-muted-foreground mt-0.5 text-[10px] tracking-wider uppercase">
              MXN · {exchange}
            </div>
          </div>

          {recentCloses.length > 1 ? (
            <div className="border-border/60 -mx-3 -mb-3 border-t px-3 py-2">
              <div className="text-muted-foreground mb-0.5 flex items-baseline justify-between text-[9px] tracking-wider uppercase">
                <span>30 días</span>
                <span className={isPositive ? "text-success" : "text-destructive"}>
                  {isPositive ? "▲" : "▼"}
                </span>
              </div>
              <SparkLine data={recentCloses} width={200} height={32} className="w-full" />
            </div>
          ) : (
            <div className="text-muted-foreground text-[10px]">Sin histórico</div>
          )}
        </div>
      </Link>
    </div>
  );
}
