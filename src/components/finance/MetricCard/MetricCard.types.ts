import type React from "react";

/**
 * Props del componente `MetricCard`.
 */
export interface MetricCardProps {
  /** Etiqueta de la métrica (se muestra en mayúsculas muted). */
  label: string;
  /** Valor a mostrar. Si es string, se muestra tal cual sin formatear. */
  value: number | string;
  /** Formato del valor. Default "number". */
  format?: "number" | "currency" | "percent";
  /** Cantidad de decimales para el formato numérico. Default 2. */
  precision?: number;
  /** Dirección de tendencia (reservada para uso futuro). */
  trend?: "up" | "down" | "flat";
  /** Diferencia/delta a mostrar como PnLBadge bajo el valor principal. */
  delta?: number;
  /** Nodo opcional de tooltip que se renderiza junto al label. */
  tooltip?: React.ReactNode;
  /** Tamaño de la card. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Variante de fondo. Default "bordered". */
  variant?: "bordered" | "filled" | "ghost";
  /** Énfasis visual del borde. Default "neutral". */
  emphasis?: "neutral" | "positive" | "negative";
  /** Clases CSS adicionales. */
  className?: string;
}
