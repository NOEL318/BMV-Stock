import { z } from "zod";

/**
 * Schema de body para PUT /api/user-preferences. Todos los campos opcionales:
 * solo se actualizan los provistos.
 */
export const updateUserPreferencesSchema = z.object({
  displayCurrency: z.enum(["MXN", "USD"]).optional(),
  defaultTimeframe: z.enum(["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  tableDensity: z.enum(["compact", "comfortable"]).optional(),
  riskProfile: z.enum(["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]).optional(),
  disclaimerAcceptedAt: z.coerce.date().nullable().optional(),
});

/** Tipo inferido del schema de actualización de preferencias del usuario. */
export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;
