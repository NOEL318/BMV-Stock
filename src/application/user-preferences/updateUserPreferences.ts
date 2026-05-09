import { DEFAULT_USER_PREFERENCES, type UserPreferences } from "@/domain/entities/UserPreferences";
import type { UserPreferencesRepository } from "@/domain/ports/UserPreferencesRepository";
import type { UpdateUserPreferencesInput } from "@/lib/schemas/userPreferences";

/**
 * Actualiza las preferencias del usuario aplicando un patch parcial.
 * Si no existen, crea con defaults + el patch.
 *
 * @param params - Objeto con `userId` (identificador del usuario autenticado),
 *   `patch` (campos a actualizar, todos opcionales) y `repo` (repositorio de
 *   preferencias de usuario).
 * @returns Las preferencias actualizadas o recién creadas.
 */
export async function updateUserPreferences({
  userId,
  patch,
  repo,
}: {
  userId: string;
  patch: UpdateUserPreferencesInput;
  repo: UserPreferencesRepository;
}): Promise<UserPreferences> {
  const existing = await repo.findByUser(userId);
  const base: UserPreferences = existing ?? { userId, ...DEFAULT_USER_PREFERENCES };
  const next: UserPreferences = {
    ...base,
    ...patch,
    userId,
  } as UserPreferences;
  return repo.upsert(next);
}
