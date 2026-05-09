"use client";

import { useState } from "react";

import { MacdChart } from "@/components/charts/MacdChart";
import { PriceChart } from "@/components/charts/PriceChart";
import type {
  PriceChartIndicator,
  PriceChartType,
} from "@/components/charts/PriceChart/PriceChart.types";
import { RsiChart } from "@/components/charts/RsiChart";
import { MetricTooltip } from "@/components/education/MetricTooltip";
import { ExchangeBadge } from "@/components/finance/ExchangeBadge";
import { MetricCard } from "@/components/finance/MetricCard";
import { MoneyDisplay } from "@/components/finance/MoneyDisplay";
import { PnLBadge } from "@/components/finance/PnLBadge";
import { SuggestedTickerCard } from "@/components/finance/SuggestedTickerCard";
import { TickerBadge } from "@/components/finance/TickerBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TimeRange } from "@/domain/entities/HistoricalPrice";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useSuggestedTickers } from "@/hooks/useSuggestedTickers";

/**
 * Timeframes intradía y diarios+ ofrecidos al usuario.
 * Se separan en dos grupos visuales en la UI para que sea claro qué es
 * granularidad fina y qué es ventana amplia.
 */
const INTRADAY_TIMEFRAMES: TimeRange[] = ["1m", "5m", "15m", "30m", "1H"];
const DAILY_TIMEFRAMES: TimeRange[] = ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"];

/** Tipos de gráfica disponibles con su label corto para la toolbar. */
const CHART_TYPES: { value: PriceChartType; label: string }[] = [
  { value: "candles", label: "Velas" },
  { value: "bars", label: "Barras" },
  { value: "line", label: "Línea" },
  { value: "area", label: "Área" },
];

/** Indicadores SMA/EMA disponibles como overlay sobre el precio. */
const AVAILABLE_INDICATORS: { value: PriceChartIndicator; label: string }[] = [
  { value: "sma20", label: "SMA 20" },
  { value: "sma50", label: "SMA 50" },
  { value: "sma200", label: "SMA 200" },
  { value: "ema12", label: "EMA 12" },
  { value: "ema26", label: "EMA 26" },
];


interface Props {
  /** Símbolo de la emisora a analizar. */
  ticker: string;
}

/**
 * Pantalla principal de análisis: precio, gráfica con indicadores,
 * métricas y tooltips educativos.
 */
export function AnalysisPageClient({ ticker }: Props) {
  const [range, setRange] = useState<TimeRange>("3M");
  const [chartType, setChartType] = useState<PriceChartType>("candles");
  const [showVolume, setShowVolume] = useState(true);
  const [activeIndicators, setActiveIndicators] = useState<PriceChartIndicator[]>([
    "sma20",
    "sma50",
  ]);
  const { data, isLoading, error } = useAnalysis(ticker, range);
  const { data: suggestionsData, isLoading: suggestionsLoading } = useSuggestedTickers();

  function toggleIndicator(ind: PriceChartIndicator): void {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind],
    );
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Cargando análisis...</p>;
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive text-sm">
            {error instanceof Error ? error.message : "No se pudo cargar el análisis"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { quote, historical, indicators } = data;
  const lastClose = historical[historical.length - 1]?.close ?? quote.priceMxn;
  const firstClose = historical[0]?.close ?? quote.priceMxn;
  const periodReturn = firstClose > 0 ? (lastClose - firstClose) / firstClose : 0;
  const lastRsi = indicators.rsi14[indicators.rsi14.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <TickerBadge ticker={quote.ticker} exchange={quote.exchange} size="lg" />
          <ExchangeBadge exchange={quote.exchange} />
        </div>
        <div className="flex items-baseline gap-3">
          <MoneyDisplay amount={quote.priceMxn} size="lg" />
          <PnLBadge percent={periodReturn} percentFormat="decimal" size="md" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
          Intradía
        </span>
        {INTRADAY_TIMEFRAMES.map((tf) => (
          <Button
            key={tf}
            variant={range === tf ? "default" : "ghost"}
            size="sm"
            onClick={() => setRange(tf)}
          >
            {tf}
          </Button>
        ))}
        <span className="bg-border mx-1 h-4 w-px" aria-hidden />
        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
          Diario
        </span>
        {DAILY_TIMEFRAMES.map((tf) => (
          <Button
            key={tf}
            variant={range === tf ? "default" : "ghost"}
            size="sm"
            onClick={() => setRange(tf)}
          >
            {tf}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-4">
          {/* Toolbar: tipo de gráfica + indicadores + volumen */}
          <div className="border-border flex flex-wrap items-center gap-x-4 gap-y-2 border-b pb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Tipo
              </span>
              {CHART_TYPES.map((t) => (
                <Button
                  key={t.value}
                  variant={chartType === t.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>

            <span className="bg-border h-4 w-px" aria-hidden />

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Indicadores
              </span>
              {AVAILABLE_INDICATORS.map((ind) => (
                <Button
                  key={ind.value}
                  variant={activeIndicators.includes(ind.value) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => toggleIndicator(ind.value)}
                >
                  {ind.label}
                </Button>
              ))}
            </div>

            <span className="bg-border h-4 w-px" aria-hidden />

            <Button
              variant={showVolume ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowVolume((v) => !v)}
            >
              Volumen
            </Button>
          </div>

          <PriceChart
            data={historical}
            type={chartType}
            indicators={activeIndicators}
            showVolume={showVolume}
            height={400}
            theme="auto"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 pt-4">
            <div className="text-muted-foreground flex items-center gap-1 text-[10px] tracking-wider uppercase">
              <span>RSI 14</span>
              <MetricTooltip concept="rsi" />
            </div>
            <RsiChart values={indicators.rsi14} height={100} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 pt-4">
            <div className="text-muted-foreground flex items-center gap-1 text-[10px] tracking-wider uppercase">
              <span>MACD</span>
              <MetricTooltip concept="macd" />
            </div>
            <MacdChart data={indicators.macd} height={120} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Apertura" value={quote.openMxn} format="currency" size="md" />
        <MetricCard label="Máximo del día" value={quote.highMxn} format="currency" size="md" />
        <MetricCard label="Mínimo del día" value={quote.lowMxn} format="currency" size="md" />
        <MetricCard label="Volumen" value={quote.volume} format="number" precision={0} size="md" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 pt-4">
            <div className="text-muted-foreground flex items-center gap-1 text-[10px] tracking-wider uppercase">
              <span>RSI 14</span>
              <MetricTooltip concept="rsi" />
            </div>
            <div className="font-mono text-2xl font-semibold tabular-nums">
              {lastRsi !== null && lastRsi !== undefined ? lastRsi.toFixed(1) : "—"}
            </div>
            <div className="text-muted-foreground text-xs">
              {lastRsi !== null && lastRsi !== undefined && lastRsi > 70
                ? "Sobrecomprado"
                : lastRsi !== null && lastRsi !== undefined && lastRsi < 30
                  ? "Sobrevendido"
                  : "Neutral"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-4">
            <div className="text-muted-foreground flex items-center gap-1 text-[10px] tracking-wider uppercase">
              <span>SMA 20</span>
              <MetricTooltip concept="sma" />
            </div>
            <div className="font-mono text-2xl font-semibold tabular-nums">
              {indicators.sma20[indicators.sma20.length - 1]?.toFixed(2) ?? "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-4">
            <div className="text-muted-foreground flex items-center gap-1 text-[10px] tracking-wider uppercase">
              <span>MACD</span>
              <MetricTooltip concept="macd" />
            </div>
            <div className="font-mono text-2xl font-semibold tabular-nums">
              {indicators.macd.macd[indicators.macd.macd.length - 1]?.toFixed(3) ?? "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sugerencias con cards: precio + sparkline para cada emisora */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">Sugerencias para explorar</h2>
          <span className="text-muted-foreground text-xs">
            Emisoras populares de BMV y SIC
          </span>
        </div>
        {suggestionsLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {(suggestionsData?.entries ?? [])
              .filter((s) => s.ticker !== quote.ticker)
              .map((entry) => (
                <SuggestedTickerCard key={entry.href} data={entry} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
