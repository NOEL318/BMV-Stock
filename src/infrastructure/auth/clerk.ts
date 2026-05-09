import { auth, currentUser } from "@clerk/nextjs/server";

import { db } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema";

/**
 * Cache en memoria de los `userId` para los que ya verificamos que existe
 * el registro espejo en la tabla `users`. Evita el INSERT redundante en
 * cada request. Se limpia al reiniciar el servidor (acepable: la operación
 * es idempotente y rápida).
 */
const ensuredUsers = new Set<string>();

/**
 * Obtiene el `userId` del usuario autenticado y garantiza que exista un
 * registro espejo en nuestra tabla `users` (necesario para foreign keys
 * desde `holdings`, `paper_portfolios`, `user_preferences`, etc.).
 *
 * La creación lazy reemplaza un webhook de Clerk: en lugar de sincronizar
 * `user.created` por webhook, hacemos un upsert idempotente la primera vez
 * que el usuario llega a un endpoint autenticado en cada proceso.
 *
 * @throws Error con status 401 si no hay sesión
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  if (!ensuredUsers.has(userId)) {
    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ?? `${userId}@clerk.local`;
    await db.insert(users).values({ id: userId, email }).onConflictDoNothing();
    ensuredUsers.add(userId);
  }
  return userId;
}

/**
 * Obtiene el usuario completo de Clerk.
 * Devuelve null si no hay sesión.
 */
export async function getCurrentClerkUser() {
  return await currentUser();
}
