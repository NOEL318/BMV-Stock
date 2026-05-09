/**
 * Definición de un concepto financiero/técnico, usada en tooltips y drawers
 * educativos.
 */
export interface ConceptDefinition {
  /** Identificador único del concepto, en kebab-case. */
  slug: string;
  /** Nombre completo del concepto para mostrar en UI. */
  title: string;
  /** Para tooltip — 1 a 2 oraciones. */
  shortExplanation: string;
  /** Para drawer detallado — markdown permitido. */
  longExplanation: string;
}

/**
 * Catálogo principal de conceptos financieros y técnicos.
 * Indexado por slug para lookup O(1).
 */
export const CONCEPTS: Record<string, ConceptDefinition> = {
  "pe-ratio": {
    slug: "pe-ratio",
    title: "P/E (Price to Earnings)",
    shortExplanation:
      "Cuántos pesos pagas por cada peso de utilidad anual. P/E bajo = barato relativo a utilidades; alto = expectativa de crecimiento.",
    longExplanation:
      "El P/E divide el precio de la acción entre la utilidad por acción del último año. Es el múltiplo más usado para valuar acciones. Un P/E de 15 significa que pagas 15 pesos por cada peso de utilidad. Comparar contra el P/E del sector y el promedio histórico de la propia emisora.",
  },
  rsi: {
    slug: "rsi",
    title: "RSI (Relative Strength Index)",
    shortExplanation:
      "Indicador técnico de momentum. Mayor a 70 es sobrecomprado (posible corrección); menor a 30 es sobrevendido (posible rebote).",
    longExplanation:
      "Wilder (1978). Calcula la fuerza relativa de las ganancias vs pérdidas en un período (típicamente 14 días). Va de 0 a 100. No es señal por sí solo — usar en combinación con tendencia y volumen.",
  },
  macd: {
    slug: "macd",
    title: "MACD (Moving Average Convergence Divergence)",
    shortExplanation:
      "Diferencia entre EMA de 12 y 26 períodos, con una línea de señal de 9 períodos. Cruces alcistas/bajistas indican cambios de tendencia.",
    longExplanation:
      "Tres componentes: línea MACD (EMA12 - EMA26), línea de señal (EMA9 del MACD), e histograma (MACD - señal). Cuando la MACD cruza arriba de la señal es bullish; cuando cruza abajo es bearish. El histograma anticipa los cruces.",
  },
  sma: {
    slug: "sma",
    title: "SMA (Simple Moving Average)",
    shortExplanation:
      "Promedio simple de los precios de los últimos N días. SMA20 (corto plazo), SMA50 (medio), SMA200 (tendencia de fondo).",
    longExplanation:
      "Ayuda a suavizar el ruido del precio diario y ver la tendencia. El precio cruzando arriba de la SMA200 suele marcar el inicio de un mercado alcista; cruzando abajo, un bajista.",
  },
  ema: {
    slug: "ema",
    title: "EMA (Exponential Moving Average)",
    shortExplanation:
      "Como SMA pero pondera más a precios recientes. Reacciona más rápido a cambios.",
    longExplanation:
      "Usa la fórmula `EMA = alpha * precio + (1-alpha) * EMA_anterior`, donde alpha depende del período. Más sensible que SMA pero también más ruidosa.",
  },
  "dividend-yield": {
    slug: "dividend-yield",
    title: "Rendimiento por dividendo",
    shortExplanation:
      "Dividendo anual dividido entre precio. Si paga $5 al año y la acción cuesta $100, el yield es 5%.",
    longExplanation:
      "Ojo: yield alto puede ser señal de problema (precio bajó porque la empresa va mal). Comparar contra el promedio del sector y revisar el payout ratio.",
  },
  "market-cap": {
    slug: "market-cap",
    title: "Capitalización de mercado",
    shortExplanation:
      "Precio multiplicado por acciones en circulación. Tamaño total de la empresa según el mercado.",
    longExplanation:
      "Categorías comunes: small cap (menor a 2B USD), mid cap (2-10B), large cap (más de 10B). En México, las emisoras del IPC son large cap mexicanas pero small/mid cap globales.",
  },
  "core-satellite": {
    slug: "core-satellite",
    title: "Núcleo / Satélite",
    shortExplanation:
      "Estrategia: la mayor parte del portafolio en ETFs amplios (núcleo, aburrido), una porción menor en apuestas activas (satélite).",
    longExplanation:
      "Estadísticamente, retail activo pierde contra el índice. Tener 70 a 90 por ciento del capital en ETFs diversificados protege el grueso, mientras una porción menor permite aprender y participar en oportunidades específicas.",
  },
  etf: {
    slug: "etf",
    title: "ETF (Exchange-Traded Fund)",
    shortExplanation:
      "Fondo que cotiza como acción. Compras una unidad y obtienes exposición a docenas o cientos de emisoras subyacentes.",
    longExplanation:
      "En México: NAFTRAC replica el IPC. Vía SIC tienes acceso a ETFs internacionales (SPY = S&P 500, QQQ = NASDAQ-100, VOO, VTI, etc.). Comisiones (TER) muy bajas (típicamente menor a 0.1 por ciento anual).",
  },
  naftrac: {
    slug: "naftrac",
    title: "NAFTRAC",
    shortExplanation:
      "ETF que replica el IPC (Índice de Precios y Cotizaciones de la BMV). Es el equivalente mexicano del SPY estadounidense.",
    longExplanation:
      "Diversificación instantánea sobre las 35+ emisoras del IPC. Comisión anual baja. Es la base recomendada para la parte mexicana del núcleo de un portafolio.",
  },
  beta: {
    slug: "beta",
    title: "Beta",
    shortExplanation:
      "Mide qué tanto se mueve una acción cuando el mercado se mueve. Beta de 1 = igual que el mercado; mayor a 1 = más volátil; menor a 1 = más estable.",
    longExplanation:
      "Calculado contra un benchmark (típicamente el IPC para emisoras mexicanas, S&P 500 para internacionales). Útil para entender el riesgo sistemático que aporta una posición al portafolio.",
  },
  volatility: {
    slug: "volatility",
    title: "Volatilidad",
    shortExplanation:
      "Qué tan variable es el precio. Mayor volatilidad = movimientos más grandes en ambas direcciones = más riesgo.",
    longExplanation:
      "Suele medirse como desviación estándar anualizada de los retornos diarios. Volatilidades típicas: ETFs amplios 15 a 20 por ciento, acciones individuales 25 a 50 por ciento, cripto 60+ por ciento.",
  },
  "dollar-cost-averaging": {
    slug: "dollar-cost-averaging",
    title: "Dollar-Cost Averaging (DCA)",
    shortExplanation:
      "Comprar el mismo monto cada periodo (semanal, mensual). Promedia tu costo y reduce el riesgo de timing.",
    longExplanation:
      "Compras más unidades cuando el precio está bajo y menos cuando está alto. Estadísticamente supera a intentar adivinar el mejor momento de entrada.",
  },
  "support-resistance": {
    slug: "support-resistance",
    title: "Soporte y resistencia",
    shortExplanation:
      "Niveles donde el precio históricamente rebota (soporte) o se frena (resistencia). Son zonas, no puntos exactos.",
    longExplanation:
      "Soportes y resistencias ganan validez con el número de veces que el precio los respeta. Cuando se rompen, suelen invertir su rol (un soporte roto se vuelve resistencia).",
  },
  volume: {
    slug: "volume",
    title: "Volumen",
    shortExplanation:
      "Cantidad de acciones intercambiadas en un período. Movimientos con alto volumen son más confiables.",
    longExplanation:
      "Un movimiento con bajo volumen suele ser ruido. Un breakout con volumen alto es más probable que se sostenga.",
  },
  "sic-mexico": {
    slug: "sic-mexico",
    title: "SIC (Sistema Internacional de Cotizaciones)",
    shortExplanation:
      "Mercado de la BMV donde puedes comprar acciones extranjeras (AAPL, SPY, etc.) liquidando en pesos.",
    longExplanation:
      "Permite a inversionistas mexicanos diversificar fuera de México sin abrir cuenta en el extranjero. El precio se cotiza convertido a MXN al spot del día. GBM+ ofrece acceso al SIC.",
  },
};
