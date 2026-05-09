import { DEFAULT_USER_PREFERENCES, type UserPreferences } from "@/domain/entities/UserPreferences";
import type { UserPreferencesRepository } from "@/domain/ports/UserPreferencesRepository";

/**
 * Obtiene las preferencias del usuario. Si no existen aún, las crea con
 * los valores default. Idempotente.
 *
 * @param params - Objeto con `userId` (identificador del usuario autenticado)
 *   y `repo` (repositorio de preferencias de usuario).
 * @returns Las preferencias existentes o las recién creadas con defaults.
 */
export async function getOrCreateUserPreferences({
  userId,
  repo,
}: {
  userId: string;
  repo: UserPreferencesRepository;
}): Promise<UserPreferences> {
  const existing = await repo.findByUser(userId);
  if (existing) return existing;
  return repo.upsert({ userId, ...DEFAULT_USER_PREFERENCES });
}
