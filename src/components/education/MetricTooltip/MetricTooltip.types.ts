/**
 * Props del componente MetricTooltip.
 */
export interface MetricTooltipProps {
  /** Slug del concepto en el catálogo CONCEPTS. */
  concept: string;
  /** Tamaño del icono de ayuda. */
  size?: "sm" | "md";
  className?: string;
}
