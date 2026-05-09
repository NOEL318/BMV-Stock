/**
 * Value object para representar porcentajes sin ambigüedad.
 * Internamente almacena el valor como fracción decimal (0.05 = 5%).
 *
 * Construir con `fromPercent(5)` para 5%, o con `fromDecimal(0.05)` para
 * el mismo 5%. Esto evita el bug clásico de "¿está en 0..1 o en 0..100?".
 */
export class Percentage {
  private constructor(private readonly _decimal: number) {}

  /**
   * Crea un Percentage desde un valor en formato decimal (ej. 0.05 = 5%).
   */
  static fromDecimal(decimal: number): Percentage {
    return new Percentage(decimal);
  }

  /**
   * Crea un Percentage desde un valor "humano" (ej. 5 = 5%).
   */
  static fromPercent(percent: number): Percentage {
    return new Percentage(percent / 100);
  }

  /**
   * Valor en formato decimal (5% = 0.05).
   */
  get asDecimal(): number {
    return this._decimal;
  }

  /**
   * Valor en formato "humano" (0.05 = 5).
   */
  get asPercent(): number {
    return this._decimal * 100;
  }

  /**
   * Aplica el porcentaje a una cantidad (multiplica por la fracción decimal).
   */
  apply(amount: number): number {
    return amount * this._decimal;
  }

  /**
   * Igualdad estructural.
   */
  equals(other: Percentage): boolean {
    return this._decimal === other._decimal;
  }

  /**
   * Formato `+X.XX%` o `-X.XX%`.
   */
  toString(): string {
    const pct = this.asPercent;
    if (pct === 0) return "0.00%";
    const sign = pct > 0 ? "+" : "";
    return `${sign}${pct.toFixed(2)}%`;
  }
}
