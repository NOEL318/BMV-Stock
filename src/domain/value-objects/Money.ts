/**
 * Monedas soportadas por el sistema.
 * Si en el futuro se agregan más (EUR, GBP), extender este tipo.
 */
export type Currency = "MXN" | "USD";

/**
 * Value object que encapsula una cantidad monetaria con su moneda.
 * Inmutable. Prohíbe mezclar monedas sin conversión explícita vía `convert()`.
 *
 * Ejemplo:
 * ```ts
 * const precio = Money.of(69.42, "MXN");
 * const comision = Money.of(0.5, "MXN");
 * const total = precio.add(comision); // Money(69.92, "MXN")
 * ```
 */
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: Currency,
  ) {}

  /**
   * Constructor estático. Preferido sobre `new Money(...)` para legibilidad.
   */
  static of(amount: number, currency: Currency): Money {
    return new Money(amount, currency);
  }

  /**
   * Suma. Lanza si las monedas no coinciden.
   * @throws Error con mensaje "currency mismatch" si las monedas difieren
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amount + other.amount, this.currency);
  }

  /**
   * Resta. Lanza si las monedas no coinciden.
   * @throws Error con mensaje "currency mismatch" si las monedas difieren
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amount - other.amount, this.currency);
  }

  /**
   * Multiplica el monto por un escalar. La moneda no cambia.
   */
  multiply(scalar: number): Money {
    return Money.of(this.amount * scalar, this.currency);
  }

  /**
   * Convierte a otra moneda multiplicando por una tasa.
   *
   * @param rate - tasa de conversión (debe ser mayor a 0)
   * @param target - moneda destino
   * @throws Error si rate es menor o igual a 0
   */
  convert(rate: number, target: Currency): Money {
    if (rate <= 0) {
      throw new Error("rate must be positive");
    }
    return Money.of(this.amount * rate, target);
  }

  /**
   * Compara igualdad estructural (amount + currency).
   */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `currency mismatch: cannot operate on ${this.currency} and ${other.currency}`,
      );
    }
  }
}
