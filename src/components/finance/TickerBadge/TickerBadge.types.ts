import type { Exchange } from "@/domain/value-objects/Ticker";

/**
 * Props del componente `TickerBadge`.
 */
export interface TickerBadgeProps {
  /** Símbolo del ticker a mostrar. */
  ticker: string;
  /** Si se provee, aplica un tint del color del exchange. */
  exchange?: Exchange;
  /** Tamaño del badge. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Clases CSS adicionales. */
  className?: string;
}
