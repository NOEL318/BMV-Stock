import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { getOrCreateUserPreferences } from "@/application/user-preferences/getOrCreateUserPreferences";
import { updateUserPreferences } from "@/application/user-preferences/updateUserPreferences";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError, parseJsonBody } from "@/lib/api-errors";
import { updateUserPreferencesSchema } from "@/lib/schemas/userPreferences";

/**
 * GET /api/user-preferences
 *
 * Devuelve las preferencias del usuario autenticado. Si no existen, las crea
 * con los valores default antes de responder.
 */
export async function GET() {
  try {
    const userId = await requireUserId();
    const { userPreferences } = getDeps();
    const prefs = await getOrCreateUserPreferences({ userId, repo: userPreferences });
    return NextResponse.json({ preferences: prefs });
  } catch (e) {
    return mapApiError(e, "/api/user-preferences GET");
  }
}

/**
 * PUT /api/user-preferences
 *
 * Aplica un patch parcial a las preferencias del usuario. Todos los campos del
 * body son opcionales; solo se actualizan los provistos.
 */
export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await parseJsonBody(req);
    const parsed = updateUserPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { userPreferences } = getDeps();
    const prefs = await updateUserPreferences({
      userId,
      patch: parsed.data,
      repo: userPreferences,
    });
    return NextResponse.json({ preferences: prefs });
  } catch (e) {
    return mapApiError(e, "/api/user-preferences PUT");
  }
}
