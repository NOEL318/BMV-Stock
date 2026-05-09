import { describe, expect, it } from "vitest";

import { Percentage } from "./Percentage";

describe("Percentage", () => {
  it("fromDecimal interpreta 0.05 como 5%", () => {
    const p = Percentage.fromDecimal(0.05);
    expect(p.asPercent).toBe(5);
    expect(p.asDecimal).toBe(0.05);
  });

  it("fromPercent interpreta 5 como 5%", () => {
    const p = Percentage.fromPercent(5);
    expect(p.asPercent).toBe(5);
    expect(p.asDecimal).toBe(0.05);
  });

  it("fromPercent acepta valores fraccionarios", () => {
    const p = Percentage.fromPercent(2.5);
    expect(p.asDecimal).toBeCloseTo(0.025, 5);
  });

  it("fromPercent acepta valores negativos (caídas)", () => {
    const p = Percentage.fromPercent(-3.2);
    expect(p.asDecimal).toBeCloseTo(-0.032, 5);
  });

  it("apply multiplica un número por la fracción decimal", () => {
    const p = Percentage.fromPercent(10);
    expect(p.apply(100)).toBe(10);
    expect(p.apply(250)).toBe(25);
  });

  it("toString formatea con signo y dos decimales", () => {
    expect(Percentage.fromPercent(5).toString()).toBe("+5.00%");
    expect(Percentage.fromPercent(-3.2).toString()).toBe("-3.20%");
    expect(Percentage.fromPercent(0).toString()).toBe("0.00%");
  });

  it("equals compara con tolerancia mínima", () => {
    expect(Percentage.fromPercent(5).equals(Percentage.fromPercent(5))).toBe(true);
    expect(Percentage.fromPercent(5).equals(Percentage.fromPercent(5.0001))).toBe(false);
  });
});
