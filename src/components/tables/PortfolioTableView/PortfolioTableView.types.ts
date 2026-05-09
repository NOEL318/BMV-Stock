import type { HoldingWithQuote } from "@/application/portfolio/getHoldings";

/**
 * Props del componente presentacional PortfolioTableView.
 */
export interface PortfolioTableViewProps {
  /** Lista de holdings con sus cotizaciones. */
  data: HoldingWithQuote[];
  /** Mostrar skeleton mientras carga. */
  loading?: boolean;
  /** Mensaje de error a mostrar en lugar de la tabla. */
  error?: string | null;
  /** Clase CSS adicional para el wrapper. */
  className?: string;
}
