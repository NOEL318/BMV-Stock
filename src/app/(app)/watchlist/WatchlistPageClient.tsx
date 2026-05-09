"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { LuTrash2 } from "react-icons/lu";
import { toast } from "sonner";

import { SparkLine } from "@/components/charts/SparkLine";
import { ExchangeBadge } from "@/components/finance/ExchangeBadge";
import { MoneyDisplay } from "@/components/finance/MoneyDisplay";
import { PnLBadge } from "@/components/finance/PnLBadge";
import { TickerBadge } from "@/components/finance/TickerBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWatchlist } from "@/hooks/useWatchlist";

/**
 * Client del watchlist: form para agregar emisora + tabla con entries.
 */
export function WatchlistPageClient() {
  const { data, isLoading } = useWatchlist();
  const queryClient = useQueryClient();
  const [ticker, setTicker] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (ticker.trim().length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          typeof body === "object" && body && "error" in body && typeof body.error === "string"
            ? body.error
            : "Error al agregar al watchlist";
        toast.error(msg);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      setTicker("");
      toast.success("Agregado al watchlist");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Error al eliminar");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    toast.success("Eliminado del watchlist");
  }

  const entries = data?.entries ?? [];

  return (
    <div className="space-y-6">
      {/* Form para agregar emisora con un input prominente */}
      <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
        <CardContent className="pt-5 pb-5">
          <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="text"
              placeholder="Busca por ticker — ej. WALMEX.MX, AAPL, SPY"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={submitting} size="lg">
              {submitting ? "Agregando..." : "Agregar al watchlist"}
            </Button>
          </form>
          <p className="text-muted-foreground mt-2 text-xs">
            Para emisoras de México usa sufijo <code className="font-mono">.MX</code> (ej. WALMEX.MX). Para
            internacional, solo el ticker (ej. AAPL).
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Aún no sigues ninguna emisora. Agrega la primera arriba.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(({ item, quote, recentCloses }) => {
            const analysisHref = `/analysis/${
              item.exchange === "BMV" ? `${item.ticker}.MX` : item.ticker
            }`;
            // Calcular cambio del periodo (primer cierre vs último cierre)
            // como aproximación del rendimiento del último mes.
            const firstClose = recentCloses?.[0] ?? null;
            const lastClose = recentCloses?.[recentCloses.length - 1] ?? null;
            const monthChangePct =
              firstClose !== null && lastClose !== null && firstClose > 0
                ? (lastClose - firstClose) / firstClose
                : null;
            const isPositive = monthChangePct !== null && monthChangePct >= 0;
            return (
              <div
                key={item.id}
                className="group bg-card hover:border-primary/40 hover:shadow-sm border-border relative overflow-hidden rounded-lg border transition-all"
              >
                {/* Botón eliminar — solo aparece en hover */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  className="absolute right-1 top-1 z-10 opacity-0 group-hover:opacity-100"
                  aria-label={`Eliminar ${item.ticker} del watchlist`}
                >
                  <LuTrash2 className="text-muted-foreground hover:text-destructive h-4 w-4" />
                </Button>

                <Link
                  href={analysisHref}
                  className="block p-4"
                  aria-label={`Ver análisis de ${item.ticker}`}
                >
                  {/* Header: ticker + exchange badge + cambio % */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1.5">
                      <TickerBadge ticker={item.ticker} exchange={item.exchange} size="md" />
                      <ExchangeBadge exchange={item.exchange} size="sm" />
                    </div>
                    {monthChangePct !== null && (
                      <PnLBadge percent={monthChangePct} percentFormat="decimal" size="sm" />
                    )}
                  </div>

                  {/* Precio actual grande */}
                  <div className="mb-3">
                    {quote ? (
                      <MoneyDisplay amount={quote.priceMxn} size="lg" showCurrency={false} />
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin datos</span>
                    )}
                    <div className="text-muted-foreground mt-0.5 text-[10px] uppercase tracking-wider">
                      MXN · {quote?.exchange === "SIC" ? "vía SIC" : "BMV"}
                    </div>
                  </div>

                  {/* SparkLine de los últimos 30 días */}
                  {recentCloses && recentCloses.length > 1 ? (
                    <div className="border-border/60 -mx-4 -mb-4 border-t px-4 py-3">
                      <div className="text-muted-foreground mb-1 flex items-baseline justify-between text-[10px] uppercase tracking-wider">
                        <span>Últimos 30 días</span>
                        <span
                          className={
                            isPositive ? "text-success" : "text-destructive"
                          }
                        >
                          {isPositive ? "▲" : "▼"}
                        </span>
                      </div>
                      <SparkLine
                        data={recentCloses}
                        width={280}
                        height={40}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-xs">
                      Sin histórico disponible
                    </div>
                  )}

                  {/* Notas opcionales */}
                  {item.notes && (
                    <p className="text-muted-foreground border-border/40 mt-3 border-t pt-2 text-xs italic">
                      {item.notes}
                    </p>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
