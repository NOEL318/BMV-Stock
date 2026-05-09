import type { Exchange } from "../value-objects/Ticker";

/**
 * Acciones posibles en un trade real.
 * - BUY: compra que aumenta cantidad y recalcula avgCost.
 * - SELL: venta que disminuye cantidad. avgCost no cambia.
 * - DIVIDEND: dividendo recibido. No afecta cantidad ni avgCost; queda para
 *   historial y para cálculo futuro de yield.
 */
export type TradeAction = "BUY" | "SELL" | "DIVIDEND";

/**
 * Trade real registrado por el usuario después de ejecutarlo en GBM+.
 * Inmutable; corregir errores requiere insertar un trade compensatorio.
 */
export interface Trade {
  id: string;
  userId: string;
  ticker: string;
  exchange: Exchange;
  action: TradeAction;
  /** Cantidad de unidades (acciones, ETFs). Para DIVIDEND se usa qty=1. */
  quantity: number;
  /** Precio por unidad en MXN. Para DIVIDEND se usa el monto total recibido. */
  priceMxn: number;
  /** Comisión cobrada por el bróker en MXN. Default 0 si GBM no cobra. */
  commissionMxn: number;
  /** Cuándo ocurrió el trade en GBM+ (no cuándo se registró). */
  executedAt: Date;
  notes: string | null;
  createdAt: Date;
}
