import { isIntradayRange, type HistoricalPrice, type TimeRange } from "@/domain/entities/HistoricalPrice";
import type { Quote } from "@/domain/entities/Quote";
import type { MarketDataProvider, MarketSnapshot } from "@/domain/ports/MarketDataProvider";
import type { QuoteCacheRepository } from "@/domain/ports/QuoteCacheRepository";
import type { Ticker } from "@/domain/value-objects/Ticker";

/**
 * TTL del cache de cotizaciones en milisegundos (60 segundos).
 * Un valor pequeño da datos casi en vivo a costa de más llamadas a Yahoo,
 * que es aceptable para uso single-user.
 */
const QUOTE_CACHE_TTL_MS = 60 * 1000;

/**
 * Mapea `TimeRange` diario a número de días calendario hacia atrás desde hoy.
 * Para rangos intradía, ver `INTRADAY_RANGES` en `HistoricalPrice.ts`.
 */
function rangeDays(range: TimeRange): number {
  switch (range) {
    case "1D":
      return 1;
    case "5D":
      return 5;
    case "1M":
      return 30;
    case "3M":
      return 90;
    case "6M":
      return 180;
    case "1Y":
      return 365;
    case "5Y":
      return 365 * 5;
    case "ALL":
      return 365 * 30;
    default:
      // Intradía: profundidad pequeña, sirve para el cálculo de "60% cubierto"
      // pero el flujo intradía nunca llega aquí (ver getHistorical).
      return 1;
  }
}

/**
 * Decorator que añade cache en DB sobre cualquier `MarketDataProvider`.
 *
 * - `getQuote`: lee de `quote_cache` si el dato tiene menos de 10 minutos;
 *   si no, delega al proveedor subyacente y persiste el resultado.
 * - `getHistorical`: si el cache contiene al menos el 60% de los días esperados
 *   sirve el cache; de lo contrario delega y persiste. Esta heurística evita
 *   pegar a Yahoo en re-visitas frecuentes sin sacrificar la primera consulta.
 * - `getMarketSnapshot`: no se cachea porque es un agregado que siempre
 *   requiere datos frescos.
 */
export class CachedMarketDataProvider implements MarketDataProvider {
  /**
   * @param delegate - Proveedor subyacente que hace la llamada real a la fuente de datos.
   * @param cache - Repositorio de cache de cotizaciones.
   */
  constructor(
    private readonly delegate: MarketDataProvider,
    private readonly cache: QuoteCacheRepository,
  ) {}

  /**
   * Retorna la cotización del ticker. Usa cache si está fresco.
   *
   * @param ticker - El ticker a consultar.
   * @returns Cotización vigente en MXN.
   */
  async getQuote(ticker: Ticker): Promise<Quote> {
    const cached = await this.cache.find(ticker.symbol, ticker.exchange);
    if (cached && Date.now() - cached.asOf.getTime() < QUOTE_CACHE_TTL_MS) {
      return cached;
    }
    const fresh = await this.delegate.getQuote(ticker);
    await this.cache.upsert(fresh);
    return fresh;
  }

  /**
   * Retorna los precios históricos del ticker en el rango dado.
   * Si el cache tiene al menos el 60% de los días esperados, lo sirve sin
   * hacer una llamada al proveedor subyacente.
   *
   * @param ticker - El ticker a consultar.
   * @param range - Rango temporal.
   * @returns Arreglo de candles OHLCV en MXN.
   */
  async getHistorical(ticker: Ticker, range: TimeRange): Promise<HistoricalPrice[]> {
    // Intradía no se cachea: los datos cambian demasiado rápido y el schema
    // de cache (PK por fecha-día) no acomoda múltiples bars del mismo día.
    if (isIntradayRange(range)) {
      return this.delegate.getHistorical(ticker, range);
    }
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - rangeDays(range));
    const cached = await this.cache.findHistorical(
      ticker.symbol,
      ticker.exchange,
      fromDate,
      new Date(),
    );
    if (cached.length >= rangeDays(range) * 0.6) {
      return cached;
    }
    const fresh = await this.delegate.getHistorical(ticker, range);
    if (fresh.length > 0) {
      await this.cache.upsertHistorical(fresh);
    }
    return fresh;
  }

  /**
   * Delega directamente al proveedor subyacente; no se cachea.
   *
   * @returns Snapshot con las cotizaciones de los benchmarks.
   */
  async getMarketSnapshot(): Promise<MarketSnapshot> {
    return this.delegate.getMarketSnapshot();
  }
}
