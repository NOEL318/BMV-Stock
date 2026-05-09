import type { Exchange } from "../value-objects/Ticker";

/**
 * OHLCV de un ticker para un instante del tiempo. Para timeframes diarios
 * o mayores, `date` es el inicio del día; para intradía, incluye hora/minuto.
 *
 * Se persiste en `historical_price` en DB para evitar pegar a Yahoo cada
 * vez que se renderiza una gráfica diaria. El intradía no se cachea (cambia
 * demasiado rápido y el schema de cache es por día).
 */
export interface HistoricalPrice {
  ticker: string;
  exchange: Exchange;
  /**
   * Timestamp del candle. Para diario es la fecha sin hora; para intradía
   * es el timestamp completo del bar.
   */
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Rango temporal soportado por las gráficas. Cada valor encapsula tanto la
 * profundidad histórica como el intervalo de cada candle:
 *
 * - Intradía: `1m`, `5m`, `15m`, `30m`, `1H` — granularidad fina, ventana
 *   corta (limitado por Yahoo a 7 días para 1m, 60 días para 5m+).
 * - Diario: `1D`, `5D`, `1M`, `3M`, `6M`, `1Y`, `5Y`, `ALL` — candles diarios
 *   sobre ventanas progresivamente más amplias.
 */
export type TimeRange =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1H"
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "1Y"
  | "5Y"
  | "ALL";

/**
 * `TimeRange` que usa intervalos intradía (sub-diarios). El resto son diarios.
 */
export const INTRADAY_RANGES: readonly TimeRange[] = ["1m", "5m", "15m", "30m", "1H"];

/**
 * Verifica si un `TimeRange` es intradía.
 */
export function isIntradayRange(range: TimeRange): boolean {
  return (INTRADAY_RANGES as readonly string[]).includes(range);
}
