/**
 * Mapa de rutas a slugs de conceptos relevantes para mostrar en el
 * `ConceptSidebar`. Se usa con `usePathname()` en el cliente.
 *
 * Para agregar conceptos a una nueva ruta, agregar una entrada con un regex
 * que matchee el pathname y la lista de slugs definidos en
 * `src/lib/concepts/definitions.ts`.
 */
const ROUTE_CONCEPTS: { match: RegExp; concepts: string[] }[] = [
  {
    match: /^\/dashboard$/,
    concepts: ["market-cap", "etf", "naftrac", "sic-mexico", "dollar-cost-averaging"],
  },
  {
    match: /^\/portfolio(\/.*)?$/,
    concepts: ["market-cap", "dividend-yield", "dollar-cost-averaging", "volume"],
  },
  {
    match: /^\/paper-trading(\/.*)?$/,
    concepts: ["core-satellite", "etf", "naftrac", "support-resistance"],
  },
  {
    match: /^\/watchlist$/,
    concepts: ["support-resistance", "volume", "beta", "volatility"],
  },
  {
    match: /^\/analysis(\/.+)?$/,
    concepts: [
      "rsi",
      "macd",
      "sma",
      "ema",
      "pe-ratio",
      "dividend-yield",
      "volume",
      "volatility",
      "beta",
      "support-resistance",
    ],
  },
  {
    match: /^\/core-allocation$/,
    concepts: ["core-satellite", "etf", "naftrac", "dollar-cost-averaging", "beta"],
  },
];

/**
 * Devuelve los slugs de conceptos relevantes para el pathname dado.
 * Si ninguna ruta matchea, regresa array vacío (el sidebar no se renderiza).
 */
export function getConceptsForRoute(pathname: string): string[] {
  for (const entry of ROUTE_CONCEPTS) {
    if (entry.match.test(pathname)) return entry.concepts;
  }
  return [];
}
