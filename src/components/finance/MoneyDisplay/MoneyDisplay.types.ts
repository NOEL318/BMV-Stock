import type { Currency } from "@/domain/value-objects/Money";

/**
 * Props del componente `MoneyDisplay`.
 */
export interface MoneyDisplayProps {
  /** Cantidad a mostrar. */
  amount: number;
  /** Moneda ISO. Default "MXN". */
  currency?: Currency;
  /** Cantidad de decimales. Default 2. */
  precision?: number;
  /** Mostrar el código ISO de la moneda al final (ej. "1,234.56 MXN"). Default true. */
  showCurrency?: boolean;
  /** Forzar signo "+" para positivos (útil en deltas). Default false. */
  signed?: boolean;
  /** Tamaño del componente. */
  size?: "sm" | "md" | "lg";
  /** Énfasis visual. */
  emphasis?: "neutral" | "positive" | "negative";
  /** Clases CSS adicionales. */
  className?: string;
}
