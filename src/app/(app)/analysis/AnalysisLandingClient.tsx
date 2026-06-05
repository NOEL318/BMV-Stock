"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SuggestedTickerCard } from "@/components/finance/SuggestedTickerCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSuggestedTickers } from "@/hooks/useSuggestedTickers";
import { SUGGESTED_TICKERS } from "@/lib/suggested-tickers";

/**
 * Pantalla landing de análisis: form de búsqueda + grid de cards con
 * cotizaciones y sparklines de los tickers populares.
 */
export function AnalysisLandingClient() {
  const router = useRouter();
  const [ticker, setTicker] = useState("");
  const { data, isLoading } = useSuggestedTickers();

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    const trimmed = ticker.trim();
    if (trimmed.length === 0) return;
    router.push(`/analysis/${encodeURIComponent(trimmed)}`);
  }

  const entries = data?.entries ?? [];

  return (
    <div className="space-y-6">
      <Card className="from-primary/5 via-card to-card border-primary/20 bg-gradient-to-br">
        <CardContent className="pt-5 pb-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="text"
              aria-label="Ticker a analizar"
              placeholder="Busca por ticker — ej. WALMEX.MX, AAPL, SPY"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="lg">
              Analizar
            </Button>
          </form>
          <p className="text-muted-foreground mt-2 text-xs">
            Para emisoras de México usa sufijo <code className="font-mono">.MX</code> (ej.
            WALMEX.MX). Para internacional, solo el ticker (ej. AAPL).
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">Sugerencias para explorar</h2>
          <span className="text-muted-foreground text-xs">
            Desliza horizontalmente para ver más
          </span>
        </div>

        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {SUGGESTED_TICKERS.map((s) => (
              <Skeleton key={s.href} className="h-20 w-[360px] shrink-0 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {entries.map((entry) => (
              <SuggestedTickerCard
                key={entry.href}
                data={entry}
                layout="horizontal"
                className="w-[360px]"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
