import { describe, expect, it, vi } from "vitest";

import { DEFAULT_USER_PREFERENCES, type UserPreferences } from "@/domain/entities/UserPreferences";
import type { UserPreferencesRepository } from "@/domain/ports/UserPreferencesRepository";

import { getOrCreateUserPreferences } from "./getOrCreateUserPreferences";

/** Preferencias de muestra para tests. */
const existingPrefs: UserPreferences = {
  userId: "u1",
  displayCurrency: "USD",
  defaultTimeframe: "1M",
  theme: "dark",
  tableDensity: "compact",
  riskProfile: "AGGRESSIVE",
  disclaimerAcceptedAt: new Date("2024-01-01"),
};

/** Crea un repositorio mock con valores por defecto. */
function makeRepo(overrides: Partial<UserPreferencesRepository> = {}): UserPreferencesRepository {
  return {
    findByUser: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockImplementation((prefs: UserPreferences) => Promise.resolve(prefs)),
    ...overrides,
  };
}

describe("getOrCreateUserPreferences", () => {
  it("regresa las preferencias existentes sin llamar a upsert", async () => {
    const repo = makeRepo({
      findByUser: vi.fn().mockResolvedValue(existingPrefs),
    });

    const result = await getOrCreateUserPreferences({ userId: "u1", repo });

    expect(result).toEqual(existingPrefs);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it("crea preferencias con defaults cuando no existen", async () => {
    const repo = makeRepo();

    const result = await getOrCreateUserPreferences({ userId: "u2", repo });

    expect(repo.findByUser).toHaveBeenCalledWith("u2");
    expect(repo.upsert).toHaveBeenCalledWith({ userId: "u2", ...DEFAULT_USER_PREFERENCES });
    expect(result.userId).toBe("u2");
    expect(result.displayCurrency).toBe(DEFAULT_USER_PREFERENCES.displayCurrency);
    expect(result.disclaimerAcceptedAt).toBeNull();
  });
});
