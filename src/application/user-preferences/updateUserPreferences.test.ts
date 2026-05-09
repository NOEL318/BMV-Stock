import { describe, expect, it, vi } from "vitest";

import { DEFAULT_USER_PREFERENCES, type UserPreferences } from "@/domain/entities/UserPreferences";
import type { UserPreferencesRepository } from "@/domain/ports/UserPreferencesRepository";

import { updateUserPreferences } from "./updateUserPreferences";

/** Preferencias existentes de muestra para tests. */
const existingPrefs: UserPreferences = {
  userId: "u1",
  displayCurrency: "MXN",
  defaultTimeframe: "3M",
  theme: "system",
  tableDensity: "comfortable",
  riskProfile: "MODERATE",
  disclaimerAcceptedAt: null,
};

/** Crea un repositorio mock con valores por defecto. */
function makeRepo(overrides: Partial<UserPreferencesRepository> = {}): UserPreferencesRepository {
  return {
    findByUser: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockImplementation((prefs: UserPreferences) => Promise.resolve(prefs)),
    ...overrides,
  };
}

describe("updateUserPreferences", () => {
  it("aplica patch sobre preferencias existentes", async () => {
    const repo = makeRepo({
      findByUser: vi.fn().mockResolvedValue(existingPrefs),
    });

    const result = await updateUserPreferences({
      userId: "u1",
      patch: { theme: "dark", riskProfile: "AGGRESSIVE" },
      repo,
    });

    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        theme: "dark",
        riskProfile: "AGGRESSIVE",
        // Campos no modificados permanecen igual.
        displayCurrency: "MXN",
        defaultTimeframe: "3M",
        tableDensity: "comfortable",
      }),
    );
    expect(result.theme).toBe("dark");
    expect(result.riskProfile).toBe("AGGRESSIVE");
    expect(result.displayCurrency).toBe("MXN");
  });

  it("crea preferencias con defaults + patch cuando no existen", async () => {
    const repo = makeRepo();

    const result = await updateUserPreferences({
      userId: "u3",
      patch: { displayCurrency: "USD" },
      repo,
    });

    expect(repo.findByUser).toHaveBeenCalledWith("u3");
    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u3",
        displayCurrency: "USD",
        theme: DEFAULT_USER_PREFERENCES.theme,
        riskProfile: DEFAULT_USER_PREFERENCES.riskProfile,
      }),
    );
    expect(result.displayCurrency).toBe("USD");
    expect(result.theme).toBe(DEFAULT_USER_PREFERENCES.theme);
  });
});
