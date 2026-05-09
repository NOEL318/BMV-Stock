import { eq } from "drizzle-orm";

import type { UserPreferences } from "@/domain/entities/UserPreferences";
import type { UserPreferencesRepository } from "@/domain/ports/UserPreferencesRepository";

import type { Database } from "../client";
import { userPreferences, type DbUserPreferences } from "../schema";

/**
 * Persistencia de preferencias del usuario. Una sola fila por usuario (PK = userId).
 */
export class DrizzleUserPreferencesRepository implements UserPreferencesRepository {
  constructor(private readonly db: Database) {}

  /** Busca las preferencias del usuario. Regresa null si aún no existen. */
  async findByUser(userId: string): Promise<UserPreferences | null> {
    const rows = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  /**
   * Inserta o actualiza las preferencias del usuario (upsert por PK userId).
   * Se usa en el primer login y cada vez que el usuario guarda cambios.
   */
  async upsert(prefs: UserPreferences): Promise<UserPreferences> {
    const [row] = await this.db
      .insert(userPreferences)
      .values({
        userId: prefs.userId,
        displayCurrency: prefs.displayCurrency,
        defaultTimeframe: prefs.defaultTimeframe,
        theme: prefs.theme,
        tableDensity: prefs.tableDensity,
        riskProfile: prefs.riskProfile,
        disclaimerAcceptedAt: prefs.disclaimerAcceptedAt,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          displayCurrency: prefs.displayCurrency,
          defaultTimeframe: prefs.defaultTimeframe,
          theme: prefs.theme,
          tableDensity: prefs.tableDensity,
          riskProfile: prefs.riskProfile,
          disclaimerAcceptedAt: prefs.disclaimerAcceptedAt,
        },
      })
      .returning();
    if (!row) throw new Error("failed to upsert user preferences");
    return this.toDomain(row);
  }

  /**
   * Mapea fila de DB a entidad de dominio.
   * No hay campos numeric en user_preferences, todos son enums/timestamps.
   */
  private toDomain(row: DbUserPreferences): UserPreferences {
    return {
      userId: row.userId,
      displayCurrency: row.displayCurrency,
      defaultTimeframe: row.defaultTimeframe,
      theme: row.theme,
      tableDensity: row.tableDensity,
      riskProfile: row.riskProfile,
      disclaimerAcceptedAt: row.disclaimerAcceptedAt,
    };
  }
}
