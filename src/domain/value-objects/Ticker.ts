import { InvalidTickerError } from "../errors/DomainError";

/**
 * Bolsas soportadas por el sistema.
 * - BMV: Bolsa Mexicana de Valores (sufijo `.MX` en Yahoo Finance)
 * - SIC: Sistema Internacional de Cotizaciones (acciones de EUA listadas
 *   en BMV pero el dato real viene del listing original USA, ej. AAPL, SPY)
 */
export type Exchange = "BMV" | "SIC";

/**
 * Regex para validar la parte del symbol. Solo letras y dígitos.
 */
const SYMBOL_REGEX = /^[A-Z0-9]+$/;

/**
 * Value object que representa un ticker bursátil con su exchange y formato
 * para Yahoo Finance.
 *
 * Convención:
 * - BMV: el usuario escribe `WALMEX.MX` o `walmex.mx`, se normaliza a `WALMEX.MX`.
 * - SIC: el usuario escribe `AAPL` o `aapl`, se normaliza a `AAPL`.
 *
 * Yahoo Finance espera el sufijo `.MX` para BMV; los SIC usan el ticker USA original.
 */
export class Ticker {
  private constructor(
    public readonly symbol: string,
    public readonly exchange: Exchange,
  ) {}

  /**
   * Parsea un string a `Ticker`. Soporta entrada en cualquier capitalización.
   * Detecta exchange:
   * - Sufijo `.MX` (case-insensitive) → BMV
   * - Sin sufijo → SIC
   *
   * @throws Error si el ticker está vacío, contiene caracteres inválidos,
   *         o tiene un sufijo distinto a `.MX`.
   */
  static parse(raw: string): Ticker {
    const trimmed = raw.trim().toUpperCase();
    if (trimmed.length === 0) {
      throw new InvalidTickerError(raw, "ticker cannot be empty");
    }

    const dotCount = (trimmed.match(/\./g) ?? []).length;
    if (dotCount > 1) {
      throw new InvalidTickerError(raw, "too many dots in symbol");
    }

    if (dotCount === 1) {
      const [symbol, suffix] = trimmed.split(".");
      if (suffix !== "MX") {
        throw new InvalidTickerError(
          raw,
          `unsupported suffix ".${suffix}" (only .MX is supported)`,
        );
      }
      if (!symbol || !SYMBOL_REGEX.test(symbol)) {
        throw new InvalidTickerError(raw, "symbol must contain only letters and digits");
      }
      return new Ticker(symbol, "BMV");
    }

    if (!SYMBOL_REGEX.test(trimmed)) {
      throw new InvalidTickerError(raw, "symbol must contain only letters and digits");
    }
    return new Ticker(trimmed, "SIC");
  }

  /**
   * Formato esperado por Yahoo Finance.
   * BMV: `SYMBOL.MX`. SIC: `SYMBOL`.
   */
  get yahooSymbol(): string {
    return this.exchange === "BMV" ? `${this.symbol}.MX` : this.symbol;
  }

  /**
   * Igualdad estructural.
   */
  equals(other: Ticker): boolean {
    return this.symbol === other.symbol && this.exchange === other.exchange;
  }

  /**
   * Representación en string (igual a `yahooSymbol`).
   */
  toString(): string {
    return this.yahooSymbol;
  }
}
