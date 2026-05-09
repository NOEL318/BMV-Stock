import { cn } from "@/lib/utils";

import { exchangeBadgeVariants } from "./ExchangeBadge.styles";
import type { ExchangeBadgeProps } from "./ExchangeBadge.types";

/**
 * Pill compacta que indica si un ticker pertenece a BMV o SIC.
 * BMV usa tint verde; SIC usa tint azul.
 */
export function ExchangeBadge({ exchange, size = "md", className }: ExchangeBadgeProps) {
  return (
    <span className={cn(exchangeBadgeVariants({ size, exchange }), className)}>{exchange}</span>
  );
}
