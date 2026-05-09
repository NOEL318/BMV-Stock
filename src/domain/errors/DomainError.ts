/**
 * Error base de todos los errores del dominio.
 * Sirve para discriminar errores propios vs errores de runtime arbitrarios
 * en los handlers de la capa de presentación.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Se lanza cuando un paper trade BUY no tiene fondos suficientes en
 * `cashBalanceMxn` del PaperPortfolio.
 */
export class InsufficientFundsError extends DomainError {
  readonly code = "INSUFFICIENT_FUNDS";

  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(
      `insufficient funds: required ${required.toFixed(2)} MXN, available ${available.toFixed(2)} MXN`,
    );
  }
}

/**
 * Se lanza al intentar vender más cantidad de la que se posee en una posición.
 */
export class InsufficientQuantityError extends DomainError {
  readonly code = "INSUFFICIENT_QUANTITY";

  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(`insufficient quantity: required ${required}, available ${available}`);
  }
}

/**
 * Se lanza cuando un ticker no pasa la validación de formato.
 * Distinto de `TickerNotFoundError` (ese aplica cuando Yahoo no conoce el ticker).
 */
export class InvalidTickerError extends DomainError {
  readonly code = "INVALID_TICKER";

  constructor(
    public readonly raw: string,
    reason: string,
  ) {
    super(`invalid ticker "${raw}": ${reason}`);
  }
}

/**
 * Se lanza cuando Yahoo (o cualquier MarketDataProvider) no encuentra el ticker.
 */
export class TickerNotFoundError extends DomainError {
  readonly code = "TICKER_NOT_FOUND";

  constructor(public readonly ticker: string) {
    super(`ticker not found: ${ticker}`);
  }
}

/**
 * Se lanza cuando la fuente de datos de mercado está caída o devuelve error
 * inesperado. Incluye un mensaje amigable para mostrar en UI.
 */
export class MarketDataUnavailableError extends DomainError {
  readonly code = "MARKET_DATA_UNAVAILABLE";

  constructor(
    public readonly providerName: string,
    public override readonly cause?: unknown,
  ) {
    super(`market data unavailable from ${providerName}`);
  }
}

/**
 * Se lanza al intentar acceder a recursos sin sesión.
 * La mayoría de las veces se traduce a HTTP 401 en la capa de presentación.
 */
export class UnauthorizedError extends DomainError {
  readonly code = "UNAUTHORIZED";

  constructor(message = "unauthorized") {
    super(message);
  }
}
