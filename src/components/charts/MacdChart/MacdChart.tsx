"use client";

import type { MACDResult } from "@/application/analysis/computeIndicators";
import { cn } from "@/lib/utils";

/**
 * Props del `MacdChart`.
 */
export interface MacdChartProps {
  data: MACDResult;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Mini-gráfica SVG del MACD con tres elementos:
 * - Línea MACD (azul/primary).
 * - Línea de señal (naranja/secondary).
 * - Histograma (verde si MACD por encima de señal, rojo si por debajo).
 *
 * Cuando la línea MACD cruza arriba de la señal, suele interpretarse como
 * señal alcista; abajo, bajista.
 */
export function MacdChart({ data, width = 800, height = 120, className }: MacdChartProps) {
  const { macd, signal, histogram } = data;

  const allValues = [...macd, ...signal, ...histogram].filter((v): v is number => v !== null);
  if (allValues.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex h-30 items-center justify-center text-xs",
          className,
        )}
      >
        Sin datos suficientes para MACD
      </div>
    );
  }

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const padding = { top: 8, bottom: 8 };
  const innerH = height - padding.top - padding.bottom;
  const total = macd.length;

  const yFor = (v: number): number => padding.top + innerH - ((v - min) / range) * innerH;
  const xFor = (i: number): number => (i / Math.max(total - 1, 1)) * width;
  const zeroY = yFor(0);

  function makePath(values: (number | null)[]): string {
    let cmd = "";
    let started = false;
    values.forEach((v, i) => {
      if (v === null) return;
      cmd += started ? ` L ${xFor(i)} ${yFor(v)}` : `M ${xFor(i)} ${yFor(v)}`;
      started = true;
    });
    return cmd;
  }

  const macdPath = makePath(macd);
  const signalPath = makePath(signal);

  // Ancho de cada barra del histograma; un par de pixeles menos para que se vean separadas.
  const barWidth = Math.max(1, width / Math.max(total - 1, 1) - 0.5);

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        {/* Línea cero */}
        <line
          x1="0"
          x2={width}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--muted-foreground)"
          strokeWidth={0.4}
          opacity={0.5}
        />
        {/* Histograma */}
        {histogram.map((h, i) => {
          if (h === null) return null;
          const x = xFor(i) - barWidth / 2;
          const y = h >= 0 ? yFor(h) : zeroY;
          const barHeight = Math.abs(yFor(h) - zeroY);
          const fill = h >= 0 ? "var(--success)" : "var(--destructive)";
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 0.5)}
              fill={fill}
              opacity={0.4}
            />
          );
        })}
        {/* Línea MACD */}
        <path d={macdPath} fill="none" stroke="var(--primary)" strokeWidth={1.5} />
        {/* Línea de señal */}
        <path d={signalPath} fill="none" stroke="#F59E0B" strokeWidth={1} />
      </svg>
      <div className="text-muted-foreground absolute top-1 right-2 flex gap-3 text-[10px]">
        <span className="inline-flex items-center gap-1">
          <span className="bg-primary inline-block h-1 w-3" /> MACD
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-1 w-3" style={{ background: "#F59E0B" }} /> Señal
        </span>
      </div>
    </div>
  );
}
