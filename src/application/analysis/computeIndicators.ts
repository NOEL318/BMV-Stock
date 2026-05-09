/**
 * Calcula la media móvil simple (SMA) de una serie de precios.
 * Los primeros `period - 1` valores son null (no hay suficientes datos).
 *
 * @param prices - serie temporal de precios
 * @param period - ventana del SMA (típicamente 20, 50, 200)
 * @returns array de la misma longitud, con null en las primeras posiciones
 */
export function computeSMA(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(prices.length).fill(null);
  if (period <= 0 || prices.length === 0) return result;
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j]!;
    }
    result[i] = sum / period;
  }
  return result;
}

/**
 * Calcula la media móvil exponencial (EMA) de una serie de precios.
 * Más sensible a precios recientes que SMA.
 *
 * Implementación estándar: el primer valor del EMA es el SMA del período
 * inicial; los siguientes usan la fórmula recursiva
 * `EMA[i] = alpha * price[i] + (1 - alpha) * EMA[i-1]` donde `alpha = 2 / (period + 1)`.
 *
 * @param prices - serie temporal de precios
 * @param period - ventana de suavizado
 * @returns array de la misma longitud, con null en las primeras posiciones
 */
export function computeEMA(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(prices.length).fill(null);
  if (period <= 0 || prices.length === 0) return result;
  const alpha = 2 / (period + 1);
  // Seed: SMA del primer período
  if (prices.length < period) return result;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i]!;
  result[period - 1] = sum / period;
  for (let i = period; i < prices.length; i++) {
    const prev = result[i - 1]!;
    result[i] = alpha * prices[i]! + (1 - alpha) * prev;
  }
  return result;
}

/**
 * Calcula el Relative Strength Index (RSI) con la fórmula original de
 * Wilder (1978). RSI mayor a 70 es sobrecomprado, menor a 30 es sobrevendido.
 *
 * @param prices - serie temporal de precios
 * @param period - período de suavizado (típicamente 14)
 * @returns array de la misma longitud, con null hasta tener suficientes datos
 */
export function computeRSI(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(prices.length).fill(null);
  if (prices.length <= period) return result;

  // Calcular cambios y separar gains de losses
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i]! - prices[i - 1]!;
    if (change >= 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  // Smoothed averages para los siguientes períodos
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i]! - prices[i - 1]!;
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

/**
 * Resultado del MACD: la línea MACD, la línea de señal y el histograma.
 */
export interface MACDResult {
  /** Diferencia entre EMA rápido y EMA lento. */
  macd: (number | null)[];
  /** EMA de la línea MACD, usada para señales de entrada/salida. */
  signal: (number | null)[];
  /** Diferencia entre MACD y señal; anticipa cruces. */
  histogram: (number | null)[];
}

/**
 * Calcula MACD con los parámetros estándar (12, 26, 9):
 * - MACD line = EMA(12) - EMA(26)
 * - Signal = EMA(9) sobre la MACD line
 * - Histogram = MACD - Signal
 *
 * @param prices - serie temporal de precios
 * @param fastPeriod - período del EMA rápido (default 12)
 * @param slowPeriod - período del EMA lento (default 26)
 * @param signalPeriod - período del EMA de la señal (default 9)
 * @returns objeto con arrays macd, signal e histogram de la misma longitud que prices
 */
export function computeMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDResult {
  const fast = computeEMA(prices, fastPeriod);
  const slow = computeEMA(prices, slowPeriod);
  const macd: (number | null)[] = prices.map((_, i) => {
    const f = fast[i] ?? null;
    const s = slow[i] ?? null;
    return f !== null && s !== null ? f - s : null;
  });
  // Para signal necesitamos EMA del MACD, pero EMA no acepta nulls — saltamos
  // los nulls iniciales y aplicamos EMA al resto.
  const macdNonNullStart = macd.findIndex((v) => v !== null);
  const signal: (number | null)[] = new Array(prices.length).fill(null);
  if (macdNonNullStart !== -1) {
    const macdValues = macd.slice(macdNonNullStart) as number[];
    const signalValues = computeEMA(macdValues, signalPeriod);
    for (let i = 0; i < signalValues.length; i++) {
      signal[macdNonNullStart + i] = signalValues[i] ?? null;
    }
  }
  const histogram = macd.map((m, i) => {
    const s = signal[i] ?? null;
    return m !== null && s !== null ? m - s : null;
  });
  return { macd, signal, histogram };
}
