import { PnLBadge } from "@/components/finance/PnLBadge";
import { cn } from "@/lib/utils";

import { metricCardVariants } from "./MetricCard.styles";
import type { MetricCardProps } from "./MetricCard.types";

/**
 * Card que muestra una métrica con label, valor y opcional delta.
 *
 * Los formatos `currency` y `percent` usan `Intl.NumberFormat` con locale es-MX;
 * `number` aplica solo separadores de miles.
 */
export function MetricCard({
  label,
  value,
  format = "number",
  precision = 2,
  delta,
  tooltip,
  size = "md",
  variant = "bordered",
  emphasis = "neutral",
  className,
}: MetricCardProps) {
  const valueStr = formatValue(value, format, precision);
  return (
    <div className={cn(metricCardVariants({ size, variant, emphasis }), className)}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[10px] tracking-wider uppercase">{label}</span>
        {tooltip}
      </div>
      <div className="font-mono text-2xl font-semibold tabular-nums">{valueStr}</div>
      {delta !== undefined && <PnLBadge amount={delta} size="sm" />}
    </div>
  );
}

/**
 * Formatea un valor numérico o string según el formato indicado.
 */
function formatValue(
  value: number | string,
  format: "number" | "currency" | "percent",
  precision: number,
): string {
  if (typeof value === "string") return value;
  if (format === "currency") {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(value);
  }
  const formatter = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  if (format === "percent") return `${formatter.format(value * 100)}%`;
  return formatter.format(value);
}
