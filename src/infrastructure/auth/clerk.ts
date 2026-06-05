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
 * Allowlist single-user (opcional). Emails con permiso de acceso, derivados de
 * `ALLOWED_USER_EMAILS` (separados por coma). Si esta vacio no se filtra
 * (cualquier usuario de Clerk entra), util en desarrollo local. En produccion
 * conviene definir la variable para que solo el dueño acceda a sus datos.
 */
const ALLOWED_EMAILS = (process.env.ALLOWED_USER_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter((e) => e.length > 0);

/**
 * Obtiene el `userId` del usuario autenticado y garantiza que exista un
 * registro espejo en nuestra tabla `users` (necesario para foreign keys
 * desde `holdings`, `paper_portfolios`, `user_preferences`, etc.).
 *
 * La creación lazy reemplaza un webhook de Clerk: en lugar de sincronizar
 * `user.created` por webhook, hacemos un upsert idempotente la primera vez
 * que el usuario llega a un endpoint autenticado en cada proceso.
 *
 * Si `ALLOWED_USER_EMAILS` esta configurada, se aplica un allowlist: los
 * usuarios cuyo email no este en la lista reciben 403. La verificacion se hace
 * antes de crear el registro espejo, asi que un usuario no permitido nunca se
 * persiste ni se cachea.
 *
 * @throws Error con status 401 si no hay sesión
 * @throws Error con status 403 si el usuario no esta en el allowlist
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  if (!ensuredUsers.has(userId)) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? `${userId}@clerk.local`;
    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email.toLowerCase())) {
      throw Object.assign(new Error("Forbidden: user not in allowlist"), { status: 403 });
    }
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
