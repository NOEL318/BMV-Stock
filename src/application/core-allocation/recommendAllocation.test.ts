import { describe, expect, it } from "vitest";

import { recommendAllocation } from "./recommendAllocation";

describe("recommendAllocation", () => {
  it("CONSERVATIVE suma 100%", () => {
    const buckets = recommendAllocation("CONSERVATIVE");
    const total = buckets.reduce((acc, b) => acc + b.percent, 0);
    expect(total).toBe(100);
  });

  it("MODERATE suma 100%", () => {
    const buckets = recommendAllocation("MODERATE");
    const total = buckets.reduce((acc, b) => acc + b.percent, 0);
    expect(total).toBe(100);
  });

  it("AGGRESSIVE suma 100%", () => {
    const buckets = recommendAllocation("AGGRESSIVE");
    const total = buckets.reduce((acc, b) => acc + b.percent, 0);
    expect(total).toBe(100);
  });

  it("regresa los 4 buckets esperados para MODERATE", () => {
    const buckets = recommendAllocation("MODERATE");
    const categories = buckets.map((b) => b.category);
    expect(categories).toContain("BMV-EQUITY");
    expect(categories).toContain("INTL-EQUITY");
    expect(categories).toContain("BONDS");
    expect(categories).toContain("CASH");
    expect(buckets).toHaveLength(4);
  });
});
