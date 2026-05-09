import type { Exchange } from "@/domain/value-objects/Ticker";

/**
 * Estructura de un ticker sugerido para mostrar en la UI.
 * `href` ya incluye el sufijo correcto para Yahoo (`.MX` para BMV, sin
 * sufijo para SIC) — listo para usar como link a `/analysis/[ticker]`.
 */
export interface SuggestedTicker {
  ticker: string;
  exchange: Exchange;
  href: string;
}

/**
 * Tickers populares para sugerir al usuario en pantallas de análisis.
 * Mezcla de BMV (las emisoras más líquidas del IPC y NAFTRAC) y SIC
 * (mega-caps de EUA + ETFs amplios).
 *
 * Lista deliberadamente corta y curada. Para v2 podría derivarse de
 * volumen del día o de los más buscados por el usuario.
 */
export const SUGGESTED_TICKERS: readonly SuggestedTicker[] = [
  // BMV — IPC y ETFs mexicanos
  { ticker: "WALMEX", exchange: "BMV", href: "/analysis/WALMEX.MX" },
  { ticker: "AMXB", exchange: "BMV", href: "/analysis/AMXB.MX" },
  { ticker: "GFNORTEO", exchange: "BMV", href: "/analysis/GFNORTEO.MX" },
  { ticker: "GMEXICOB", exchange: "BMV", href: "/analysis/GMEXICOB.MX" },
  { ticker: "CEMEXCPO", exchange: "BMV", href: "/analysis/CEMEXCPO.MX" },
  { ticker: "FEMSAUBD", exchange: "BMV", href: "/analysis/FEMSAUBD.MX" },
  { ticker: "NAFTRAC", exchange: "BMV", href: "/analysis/NAFTRAC.MX" },
  // SIC — mega-caps de EUA y ETFs amplios
  { ticker: "AAPL", exchange: "SIC", href: "/analysis/AAPL" },
  { ticker: "MSFT", exchange: "SIC", href: "/analysis/MSFT" },
  { ticker: "GOOGL", exchange: "SIC", href: "/analysis/GOOGL" },
  { ticker: "AMZN", exchange: "SIC", href: "/analysis/AMZN" },
  { ticker: "NVDA", exchange: "SIC", href: "/analysis/NVDA" },
  { ticker: "TSLA", exchange: "SIC", href: "/analysis/TSLA" },
  { ticker: "SPY", exchange: "SIC", href: "/analysis/SPY" },
  { ticker: "QQQ", exchange: "SIC", href: "/analysis/QQQ" },
  { ticker: "VOO", exchange: "SIC", href: "/analysis/VOO" },
];
