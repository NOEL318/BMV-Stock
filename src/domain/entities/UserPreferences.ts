import type { Currency } from "../value-objects/Money";

export type Timeframe = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "5Y";
export type Theme = "light" | "dark" | "system";
export type TableDensity = "compact" | "comfortable";
export type RiskProfile = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";

/**
 * Preferencias del usuario, persistidas en DB y editables desde /settings.
 * Si `disclaimerAcceptedAt` es null, significa que el usuario no ha aceptado el
 * modal de disclaimer en su primer login.
 */
export interface UserPreferences {
  userId: string;
  displayCurrency: Currency;
  defaultTimeframe: Timeframe;
  theme: Theme;
  tableDensity: TableDensity;
  riskProfile: RiskProfile;
  disclaimerAcceptedAt: Date | null;
}

/**
 * Valores default usados al crear UserPreferences para un usuario nuevo.
 */
export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, "userId"> = {
  displayCurrency: "MXN",
  defaultTimeframe: "3M",
  theme: "system",
  tableDensity: "comfortable",
  riskProfile: "MODERATE",
  disclaimerAcceptedAt: null,
};
