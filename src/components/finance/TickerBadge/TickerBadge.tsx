import { cn } from "@/lib/utils";

import { tickerBadgeVariants } from "./TickerBadge.styles";
import type { TickerBadgeProps } from "./TickerBadge.types";

/**
 * Badge que muestra un ticker bursátil en mono uppercase. Si se pasa
 * `exchange`, aplica un tint sutil del color asociado al mercado.
 */
export function TickerBadge({ ticker, exchange, size = "md", className }: TickerBadgeProps) {
  return (
    <span className={cn(tickerBadgeVariants({ size, exchange: exchange ?? "none" }), className)}>
      {ticker}
    </span>
  );
}
