import { describe, expect, it } from "vitest";

import { DEFAULT_USER_PREFERENCES } from "./UserPreferences";

describe("DEFAULT_USER_PREFERENCES", () => {
  it("tiene los valores por defecto esperados", () => {
    expect(DEFAULT_USER_PREFERENCES.displayCurrency).toBe("MXN");
    expect(DEFAULT_USER_PREFERENCES.defaultTimeframe).toBe("3M");
    expect(DEFAULT_USER_PREFERENCES.theme).toBe("system");
    expect(DEFAULT_USER_PREFERENCES.tableDensity).toBe("comfortable");
    expect(DEFAULT_USER_PREFERENCES.riskProfile).toBe("MODERATE");
    expect(DEFAULT_USER_PREFERENCES.disclaimerAcceptedAt).toBeNull();
  });
});
