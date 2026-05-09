"use client";

import { cn } from "@/lib/utils";

/**
 * Props del componente SparkLine.
 */
export interface SparkLineProps {
  /** Serie de valores numéricos a graficar. */
  data: number[];
  /** Ancho del SVG en píxeles. */
  width?: number;
  /** Alto del SVG en píxeles. */
  height?: number;
  /**
   * Color de la línea (CSS color string).
   * Si no se proporciona, usa verde cuando el último valor es mayor o igual
   * al primero, rojo en caso contrario.
   */
  stroke?: string;
  className?: string;
}

/**
 * Mini-gráfica SVG sin ejes ni labels. Útil para tablas de watchlist
 * y tarjetas resumen.
 */
export function SparkLine({ data, width = 80, height = 24, stroke, className }: SparkLineProps) {
  if (data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1 || 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const positive = (data[data.length - 1] ?? 0) >= (data[0] ?? 0);
  const color = stroke ?? (positive ? "var(--success)" : "var(--destructive)");
  return (
    <svg width={width} height={height} className={cn(className)}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}
