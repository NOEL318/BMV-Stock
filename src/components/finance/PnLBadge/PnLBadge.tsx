import { LuTrendingDown, LuTrendingUp } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { pnlBadgeVariants } from "./PnLBadge.styles";
import type { PnLBadgeProps } from "./PnLBadge.types";

/**
 * Badge de P&L con color automático según el signo: verde si positivo,
 * rojo si negativo, neutro si cero.
 *
 * Acepta `amount` (MXN) y/o `percent` (decimal o humano según `percentFormat`).
 */
export function PnLBadge({
  amount,
  percent,
  percentFormat = "decimal",
  size = "md",
  showIcon = true,
  className,
}: PnLBadgeProps) {
  const referenceValue = amount ?? percent ?? 0;
  const sign = referenceValue > 0 ? "positive" : referenceValue < 0 ? "negative" : "neutral";

  const Icon = sign === "positive" ? LuTrendingUp : sign === "negative" ? LuTrendingDown : null;

  const pctValue =
    percent !== undefined ? (percentFormat === "decimal" ? percent * 100 : percent) : null;

  const formatter = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "always",
  });

  return (
    <span className={cn(pnlBadgeVariants({ size, sign }), className)}>
      {showIcon && Icon ? <Icon aria-hidden className="h-3 w-3" /> : null}
      {pctValue !== null && <span>{formatter.format(pctValue)}%</span>}
      {amount !== undefined && pctValue !== null && (
        <span className="text-muted-foreground">·</span>
      )}
      {amount !== undefined && (
        <span className="font-mono tabular-nums">{formatter.format(amount)}</span>
      )}
    </span>
  );
}
