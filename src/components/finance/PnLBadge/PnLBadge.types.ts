/**
 * Props del componente `PnLBadge`.
 */
export interface PnLBadgeProps {
  /** Cantidad en MXN. Si se omite, solo se muestra el porcentaje. */
  amount?: number;
  /**
   * Porcentaje en formato decimal (0.05 = 5%) o como número humano según
   * `percentFormat`.
   */
  percent?: number;
  /**
   * Si "decimal" interpreta percent como 0.05 = 5%;
   * si "human" lo interpreta como 5 = 5%. Default "decimal".
   */
  percentFormat?: "decimal" | "human";
  /** Tamaño del badge. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Mostrar icono de tendencia (TrendingUp/TrendingDown). Default true. */
  showIcon?: boolean;
  /** Clases CSS adicionales. */
  className?: string;
}
