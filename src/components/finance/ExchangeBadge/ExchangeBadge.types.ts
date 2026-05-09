/**
 * Props del componente `ExchangeBadge`.
 */
export interface ExchangeBadgeProps {
  /** Exchange a mostrar: BMV (verde) o SIC (azul). */
  exchange: "BMV" | "SIC";
  /** Tamaño del badge. Default "md". */
  size?: "sm" | "md";
  /** Clases CSS adicionales. */
  className?: string;
}
