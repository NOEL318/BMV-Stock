import type { Exchange } from "../value-objects/Ticker";

/**
 * Cotización en tiempo casi-real de una emisora.
 * Para tickers SIC, `priceUsd` viene del listing original USA y `priceMxn`
 * se calcula al spot del día. Para BMV solo se usa priceMxn.
 */
export interface Quote {
  ticker: string;
  exchange: Exchange;
  /** Precio actual en MXN (canónico para la app). */
  priceMxn: number;
  /** Precio en USD si es SIC; null si es BMV. */
  priceUsd: number | null;
  openMxn: number;
  highMxn: number;
  lowMxn: number;
  /** Volumen del día (acciones, no MXN). */
  volume: number;
  /** Timestamp del dato según Yahoo. Puede tener delay de 15 a 20 min. */
  asOf: Date;
}
