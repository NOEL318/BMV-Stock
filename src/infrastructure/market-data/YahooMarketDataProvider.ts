import YahooFinance from "yahoo-finance2";

import type { HistoricalPrice, TimeRange } from "@/domain/entities/HistoricalPrice";
import type { Quote } from "@/domain/entities/Quote";
import { MarketDataUnavailableError, TickerNotFoundError } from "@/domain/errors/DomainError";
import type { MarketDataProvider, MarketSnapshot } from "@/domain/ports/MarketDataProvider";
import type { Ticker } from "@/domain/value-objects/Ticker";

/**
 * Instancia compartida del cliente de Yahoo Finance v3.
 * Se crea una sola vez para reutilizar la configuración HTTP.
 */
const yf = new YahooFinance();

/**
 * Tickers de los benchmarks que se muestran en el dashboard.
 */
const BENCHMARK_TICKERS = {
  ipc: "^MXX",
  usdMxn: "MXN=X",
  sp500: "^GSPC",
  nasdaq: "^IXIC",
} as const;

/** Símbolo Yahoo del spot USD/MXN. */
const FX_SYMBOL = "MXN=X";

/** TTL del cache en memoria del tipo de cambio USD/MXN (60s). */
const FX_TTL_MS = 60 * 1000;

/** Timeout máximo para una llamada a Yahoo antes de degradar a error controlado. */
const REQUEST_TIMEOUT_MS = 10 * 1000;

/**
 * Cache en memoria del spot USD/MXN. Evita pedir `MXN=X` en cada quote/historical
 * de un ticker SIC (que de otro modo dispararia una llamada extra por ticker).
 * Se comparte a nivel de proceso; en serverless cada instancia tiene la suya.
 */
let fxCache: { rate: number; at: number } | null = null;

/**
 * Envuelve una promesa con un timeout. Si no resuelve en `ms`, rechaza con
 * `MarketDataUnavailableError` para que la app degrade rápido en vez de quedar
 * colgada esperando a Yahoo.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new MarketDataUnavailableError("yahoo-finance2", `timeout (${ms}ms): ${label}`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/**
 * Mapea `TimeRange` a los parámetros que espera `yf.chart()`:
 * - `daysBack`: cuántos días hacia atrás desde hoy para `period1`.
 * - `interval`: granularidad de cada candle.
 *
 * Para intradía, Yahoo limita la profundidad: 1m solo cubre los últimos
 * 7 días; 5m/15m/30m/60m hasta 60 días.
 */
function rangeToYahooParams(range: TimeRange): {
  daysBack: number;
  interval: "1m" | "5m" | "15m" | "30m" | "60m" | "1d";
} {
  switch (range) {
    case "1m":
      return { daysBack: 1, interval: "1m" };
    case "5m":
      return { daysBack: 5, interval: "5m" };
    case "15m":
      return { daysBack: 5, interval: "15m" };
    case "30m":
      return { daysBack: 10, interval: "30m" };
    case "1H":
      return { daysBack: 30, interval: "60m" };
    case "1D":
      return { daysBack: 1, interval: "1d" };
    case "5D":
      return { daysBack: 5, interval: "1d" };
    case "1M":
      return { daysBack: 30, interval: "1d" };
    case "3M":
      return { daysBack: 90, interval: "1d" };
    case "6M":
      return { daysBack: 180, interval: "1d" };
    case "1Y":
      return { daysBack: 365, interval: "1d" };
    case "5Y":
      return { daysBack: 365 * 5, interval: "1d" };
    case "ALL":
      return { daysBack: 365 * 30, interval: "1d" };
  }
}

/**
 * Implementación de `MarketDataProvider` usando la librería `yahoo-finance2` v3.
 *
 * Para tickers SIC, se hacen dos llamadas: una para el ticker en USD
 * y otra para `MXN=X` (USD/MXN spot). El `priceMxn` se calcula multiplicando
 * el precio nativo por la tasa. Para tickers BMV solo se hace una llamada.
 *
 * Errores:
 * - Si Yahoo no encuentra el ticker, lanza `TickerNotFoundError`.
 * - Si Yahoo está caído o regresa error inesperado, lanza
 *   `MarketDataUnavailableError`.
 */
export class YahooMarketDataProvider implements MarketDataProvider {
  /**
   * Obtiene el spot USD/MXN, con cache en memoria de corta duración para no
   * pedir `MXN=X` en cada quote/historical de tickers SIC.
   *
   * @throws `MarketDataUnavailableError` si Yahoo no devuelve el spot.
   */
  private async getUsdMxnRate(): Promise<number> {
    if (fxCache && Date.now() - fxCache.at < FX_TTL_MS) {
      return fxCache.rate;
    }
    const fxQuote = await withTimeout(yf.quote(FX_SYMBOL), REQUEST_TIMEOUT_MS, FX_SYMBOL);
    const rate = fxQuote?.regularMarketPrice;
    if (rate === undefined || rate === null) {
      throw new MarketDataUnavailableError("yahoo-finance2", "missing USDMXN spot");
    }
    fxCache = { rate, at: Date.now() };
    return rate;
  }

  /**
   * Obtiene la cotización actual de un ticker.
   *
   * @param ticker - El ticker a consultar.
   * @returns Cotización con precio en MXN y, para SIC, también en USD.
   * @throws `TickerNotFoundError` si Yahoo no conoce el ticker.
   * @throws `MarketDataUnavailableError` si Yahoo no está disponible.
   */
  async getQuote(ticker: Ticker): Promise<Quote> {
    try {
      const yahooQuote = await withTimeout(
        yf.quote(ticker.yahooSymbol),
        REQUEST_TIMEOUT_MS,
        ticker.yahooSymbol,
      );
      if (!yahooQuote || yahooQuote.regularMarketPrice === undefined) {
        throw new TickerNotFoundError(ticker.toString());
      }
      const priceNative = yahooQuote.regularMarketPrice;
      let priceUsd: number | null = null;
      let priceMxn: number;
      let fxRate = 1;
      if (ticker.exchange === "SIC") {
        priceUsd = priceNative;
        fxRate = await this.getUsdMxnRate();
        priceMxn = priceNative * fxRate;
      } else {
        priceMxn = priceNative;
      }
      const open = yahooQuote.regularMarketOpen ?? priceNative;
      const high = yahooQuote.regularMarketDayHigh ?? priceNative;
      const low = yahooQuote.regularMarketDayLow ?? priceNative;
      const volume = Number(yahooQuote.regularMarketVolume ?? 0);
      return {
        ticker: ticker.symbol,
        exchange: ticker.exchange,
        priceMxn,
        priceUsd,
        openMxn: open * fxRate,
        highMxn: high * fxRate,
        lowMxn: low * fxRate,
        volume,
        asOf: yahooQuote.regularMarketTime ?? new Date(),
      };
    } catch (e) {
      if (e instanceof TickerNotFoundError || e instanceof MarketDataUnavailableError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      if (/not found|invalid/i.test(msg)) {
        throw new TickerNotFoundError(ticker.toString());
      }
      throw new MarketDataUnavailableError("yahoo-finance2", e);
    }
  }

  /**
   * Obtiene los precios históricos OHLCV para un rango temporal.
   *
   * @param ticker - El ticker a consultar.
   * @param range - Rango temporal (ej. "1M", "1Y").
   * @returns Arreglo de candles diarios en MXN.
   * @throws `TickerNotFoundError` si Yahoo no conoce el ticker.
   * @throws `MarketDataUnavailableError` si Yahoo no está disponible.
   */
  async getHistorical(ticker: Ticker, range: TimeRange): Promise<HistoricalPrice[]> {
    try {
      const { daysBack, interval } = rangeToYahooParams(range);
      const period2 = new Date();
      const period1 = new Date();
      period1.setDate(period1.getDate() - daysBack);
      const result = await withTimeout(
        yf.chart(ticker.yahooSymbol, { period1, period2, interval }),
        REQUEST_TIMEOUT_MS,
        `chart ${ticker.yahooSymbol}`,
      );
      // Para SIC convertimos a MXN con el spot. Si el FX falla, propagamos el
      // error en vez de caer silenciosamente a 1 (que daria precios ~17x mas
      // bajos presentados como MXN).
      const fxRate = ticker.exchange === "SIC" ? await this.getUsdMxnRate() : 1;
      return (result.quotes ?? [])
        .filter((q) => q.close !== null && q.close !== undefined)
        .map((q) => ({
          ticker: ticker.symbol,
          exchange: ticker.exchange,
          date: q.date,
          open: (q.open ?? 0) * fxRate,
          high: (q.high ?? 0) * fxRate,
          low: (q.low ?? 0) * fxRate,
          close: (q.close ?? 0) * fxRate,
          volume: q.volume ?? 0,
        }));
    } catch (e) {
      if (e instanceof TickerNotFoundError || e instanceof MarketDataUnavailableError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      if (/not found|invalid/i.test(msg)) {
        throw new TickerNotFoundError(ticker.toString());
      }
      throw new MarketDataUnavailableError("yahoo-finance2", e);
    }
  }

  /**
   * Obtiene un snapshot de los benchmarks para el dashboard.
   *
   * Consulta en paralelo IPC, USD/MXN, S&P 500 y NASDAQ.
   *
   * @returns Snapshot con las cuatro cotizaciones de referencia.
   * @throws `MarketDataUnavailableError` si Yahoo no está disponible.
   */
  async getMarketSnapshot(): Promise<MarketSnapshot> {
    try {
      const [ipcQ, usdMxnQ, sp500Q, nasdaqQ] = await Promise.all([
        withTimeout(yf.quote(BENCHMARK_TICKERS.ipc), REQUEST_TIMEOUT_MS, BENCHMARK_TICKERS.ipc),
        withTimeout(
          yf.quote(BENCHMARK_TICKERS.usdMxn),
          REQUEST_TIMEOUT_MS,
          BENCHMARK_TICKERS.usdMxn,
        ),
        withTimeout(yf.quote(BENCHMARK_TICKERS.sp500), REQUEST_TIMEOUT_MS, BENCHMARK_TICKERS.sp500),
        withTimeout(
          yf.quote(BENCHMARK_TICKERS.nasdaq),
          REQUEST_TIMEOUT_MS,
          BENCHMARK_TICKERS.nasdaq,
        ),
      ]);
      const usdMxnRate = usdMxnQ?.regularMarketPrice ?? 1;

      /**
       * Convierte un quote de Yahoo al formato interno `Quote`.
       */
      const toQuote = (
        q: typeof ipcQ,
        symbol: string,
        exchange: "BMV" | "SIC",
        usdToMxn: number,
      ): Quote => ({
        ticker: symbol,
        exchange,
        priceMxn: (q?.regularMarketPrice ?? 0) * usdToMxn,
        priceUsd: exchange === "SIC" ? (q?.regularMarketPrice ?? 0) : null,
        openMxn: (q?.regularMarketOpen ?? 0) * usdToMxn,
        highMxn: (q?.regularMarketDayHigh ?? 0) * usdToMxn,
        lowMxn: (q?.regularMarketDayLow ?? 0) * usdToMxn,
        volume: Number(q?.regularMarketVolume ?? 0),
        asOf: q?.regularMarketTime ?? new Date(),
      });

      return {
        ipc: toQuote(ipcQ, "IPC", "BMV", 1),
        usdMxn: toQuote(usdMxnQ, "USDMXN", "SIC", 1),
        sp500: toQuote(sp500Q, "SPX", "SIC", usdMxnRate),
        nasdaq: toQuote(nasdaqQ, "IXIC", "SIC", usdMxnRate),
      };
    } catch (e) {
      if (e instanceof MarketDataUnavailableError) throw e;
      throw new MarketDataUnavailableError("yahoo-finance2", e);
    }
  }
}
