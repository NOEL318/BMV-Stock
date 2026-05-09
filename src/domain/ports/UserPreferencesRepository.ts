import type { UserPreferences } from "../entities/UserPreferences";

/**
 * Persistencia de preferencias del usuario.
 */
export interface UserPreferencesRepository {
  findByUser(userId: string): Promise<UserPreferences | null>;
  /**
   * Inserta o actualiza las preferencias del usuario. Si no existe registro,
   * lo crea con los valores dados; si existe, lo reemplaza.
   */
  upsert(prefs: UserPreferences): Promise<UserPreferences>;
}
