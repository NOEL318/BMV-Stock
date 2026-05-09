"use client";

import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

import { computeSMA } from "@/application/analysis/computeIndicators";
import { cn } from "@/lib/utils";

import type { PriceChartProps } from "./PriceChart.types";

/**
 * Wrapper minimalista de Lightweight Charts (TradingView).
 *
 * Renderiza una gráfica de velas/línea y dibuja indicadores como overlays.
 * El theme se resuelve al montar y se actualiza si cambia la clase `.dark`.
 */
export function PriceChart({
  data,
  type = "candles",
  indicators = [],
  showVolume = false,
  height = 400,
  theme = "auto",
  className,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const isDark =
      theme === "dark" || (theme === "auto" && document.documentElement.classList.contains("dark"));
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDark ? "#a1a1aa" : "#71717a",
      },
      grid: {
        vertLines: { color: isDark ? "#27272a" : "#e4e4e7" },
        horzLines: { color: isDark ? "#27272a" : "#e4e4e7" },
      },
      timeScale: {
        borderColor: isDark ? "#27272a" : "#e4e4e7",
        // Mostrar hora cuando los datos son intradía. Para diario, Lightweight
        // Charts ignora este flag.
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: { borderColor: isDark ? "#27272a" : "#e4e4e7" },
    });
    chartRef.current = chart;

    // Detectar si los datos son intradía: si algún bar tiene horas/minutos
    // distintos de cero (UTC), tratamos toda la serie como intradía y usamos
    // timestamps UNIX en segundos. Para datos diarios usamos formato `YYYY-MM-DD`
    // que Lightweight Charts interpreta como BusinessDay.
    const dates = data.map((d) => new Date(d.date));
    const isIntraday = dates.some(
      (date) =>
        date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || date.getUTCSeconds() !== 0,
    );

    const points = data.map((d, i) => {
      const date = dates[i]!;
      return {
        time: (isIntraday
          ? Math.floor(date.getTime() / 1000)
          : date.toISOString().slice(0, 10)) as never,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        value: d.close,
        volume: d.volume,
      };
    });

    if (type === "candles") {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#16A34A",
        downColor: "#DC2626",
        borderVisible: false,
        wickUpColor: "#16A34A",
        wickDownColor: "#DC2626",
      });
      series.setData(points);
    } else if (type === "bars") {
      const series = chart.addSeries(BarSeries, {
        upColor: "#16A34A",
        downColor: "#DC2626",
      });
      series.setData(points);
    } else if (type === "area") {
      const primary = isDark ? "#60A5FA" : "#1E3A8A";
      const series = chart.addSeries(AreaSeries, {
        lineColor: primary,
        topColor: isDark ? "rgba(96,165,250,0.45)" : "rgba(30,58,138,0.30)",
        bottomColor: isDark ? "rgba(96,165,250,0)" : "rgba(30,58,138,0)",
        lineWidth: 2,
      });
      series.setData(points.map((p) => ({ time: p.time, value: p.value })));
    } else {
      const series = chart.addSeries(LineSeries, {
        color: isDark ? "#60A5FA" : "#1E3A8A",
        lineWidth: 2,
      });
      series.setData(points.map((p) => ({ time: p.time, value: p.value })));
    }

    // Dibujar indicadores como overlays sobre la gráfica principal
    const closes = data.map((d) => d.close);
    for (const ind of indicators) {
      const config: Record<string, { period: number; color: string }> = {
        sma20: { period: 20, color: "#3B82F6" },
        sma50: { period: 50, color: "#F59E0B" },
        sma200: { period: 200, color: "#8B5CF6" },
        ema12: { period: 12, color: "#22D3EE" },
        ema26: { period: 26, color: "#F472B6" },
      };
      const c = config[ind];
      if (!c) continue;
      const values = computeSMA(closes, c.period);
      const series = chart.addSeries(LineSeries, { color: c.color, lineWidth: 1 });
      series.setData(
        values
          .map((v, i) => ({ time: points[i]!.time, value: v }))
          .filter((p): p is { time: never; value: number } => p.value !== null),
      );
    }

    // Histograma de volumen en la parte inferior
    if (showVolume) {
      const volSeries = chart.addSeries(HistogramSeries, {
        color: isDark ? "#27272a" : "#e4e4e7",
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });
      volSeries.setData(points.map((p) => ({ time: p.time, value: p.volume })));
      volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    }

    chart.timeScale().fitContent();

    // Redimensionar el chart cuando cambia el tamaño del contenedor
    const handleResize = (): void => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, type, indicators, showVolume, height, theme]);

  return <div ref={containerRef} className={cn("w-full", className)} style={{ height }} />;
}
