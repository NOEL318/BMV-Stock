import { NextResponse } from "next/server";
import { z } from "zod";

import { recommendAllocation } from "@/application/core-allocation/recommendAllocation";
import { requireUserId } from "@/infrastructure/auth/clerk";

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
    const body: unknown = await req.json();
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
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("/api/core-allocation error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
