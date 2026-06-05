"use client";

import { cn } from "@/lib/utils";

/**
 * Props del `RsiChart`.
 */
export interface RsiChartProps {
  /** Valores de RSI (0-100). Los `null` se omiten al dibujar. */
  values: (number | null)[];
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Mini-gráfica SVG del RSI con líneas de referencia en 30 y 70.
 * Diseñada para ir abajo de la gráfica principal en la página de análisis.
 *
 * Convención: arriba de 70 es zona de sobrecompra (línea roja);
 * abajo de 30 es zona de sobreventa (línea verde).
 */
export function RsiChart({ values, width = 800, height = 100, className }: RsiChartProps) {
  const valid = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v !== null);

  if (valid.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex h-24 items-center justify-center text-xs",
          className,
        )}
      >
        Sin datos suficientes para RSI
      </div>
    );
  }

  const total = values.length;
  const padding = { top: 8, bottom: 8, left: 0, right: 0 };
  const innerH = height - padding.top - padding.bottom;

  const yFor = (rsi: number): number => padding.top + innerH - (rsi / 100) * innerH;
  const xFor = (i: number): number => (i / Math.max(total - 1, 1)) * width;

  const linePath = valid
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${xFor(p.i)} ${yFor(p.v)}`)
    .join(" ");

  const last = valid[valid.length - 1]!.v;
  const lineColor =
    last >= 70 ? "var(--destructive)" : last <= 30 ? "var(--success)" : "var(--primary)";

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        {/* Línea de sobrecompra (70) */}
        <line
          x1="0"
          x2={width}
          y1={yFor(70)}
          y2={yFor(70)}
          stroke="var(--destructive)"
          strokeWidth={0.5}
          strokeDasharray="4 4"
          opacity={0.5}
        />
        {/* Línea media (50) */}
        <line
          x1="0"
          x2={width}
          y1={yFor(50)}
          y2={yFor(50)}
          stroke="var(--muted-foreground)"
          strokeWidth={0.3}
          strokeDasharray="2 4"
          opacity={0.4}
        />
        {/* Línea de sobreventa (30) */}
        <line
          x1="0"
          x2={width}
          y1={yFor(30)}
          y2={yFor(30)}
          stroke="var(--success)"
          strokeWidth={0.5}
          strokeDasharray="4 4"
          opacity={0.5}
        />
        {/* Curva RSI */}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth={1.5} />
      </svg>
      <div className="text-muted-foreground absolute top-1 right-2 text-[10px]">
        70 sobrecomprado · 30 sobrevendido
      </div>
    </div>
  );
}
