import type { HistoricalPrice } from "@/domain/entities/HistoricalPrice";

/**
 * Tipo de representación visual de la gráfica de precios.
 * - `candles`: velas OHLC clásicas.
 * - `line`: línea de cierre solamente.
 * - `area`: línea con relleno degradado debajo.
 * - `bars`: barras OHLC (cada bar muestra apertura, máximo, mínimo y cierre con marcadores).
 */
export type PriceChartType = "candles" | "line" | "area" | "bars";

/** Overlays de indicadores técnicos soportados. */
export type PriceChartIndicator = "sma20" | "sma50" | "sma200" | "ema12" | "ema26";

/**
 * Props del componente PriceChart.
 */
export interface PriceChartProps {
  /** Serie OHLCV diaria a graficar. */
  data: HistoricalPrice[];
  /** Tipo de gráfica. Por defecto "candles". */
  type?: PriceChartType;
  /** Lista de overlays de indicadores técnicos a dibujar sobre la gráfica. */
  indicators?: PriceChartIndicator[];
  /** Mostrar volumen como histograma en la parte inferior. */
  showVolume?: boolean;
  /** Altura en píxeles. */
  height?: number;
  /** "auto" sigue el theme del documento (clase .dark en html). */
  theme?: "light" | "dark" | "auto";
  className?: string;
}
