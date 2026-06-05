import { NextResponse } from "next/server";
import { z } from "zod";

import { recommendAllocation } from "@/application/core-allocation/recommendAllocation";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError, parseJsonBody } from "@/lib/api-errors";

/** Schema de validación para el body del endpoint. */
const bodySchema = z.object({
  riskProfile: z.enum(["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]),
});

/**
 * POST /api/core-allocation
 *
 * Recibe un `riskProfile` y devuelve la asignación de núcleo recomendada.
 * Requiere sesión activa. La suma de porcentajes siempre es 100.
 */
export async function POST(req: Request) {
  try {
    await requireUserId();
    const body = await parseJsonBody(req);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const allocation = recommendAllocation(parsed.data.riskProfile);
    return NextResponse.json({ allocation });
  } catch (e) {
    return mapApiError(e, "/api/core-allocation");
  }
}
