import { NextResponse } from "next/server";

import { DomainError } from "@/domain/errors/DomainError";

/**
 * Mapea el `code` de un `DomainError` a un status HTTP apropiado.
 */
function domainErrorStatus(code: string): number {
  switch (code) {
    case "TICKER_NOT_FOUND":
      return 404;
    case "MARKET_DATA_UNAVAILABLE":
      return 503;
    case "UNAUTHORIZED":
      return 401;
    // Violaciones de regla de negocio: la peticion es sintacticamente valida
    // pero no se puede procesar (422 Unprocessable Entity).
    case "INSUFFICIENT_FUNDS":
    case "INSUFFICIENT_QUANTITY":
      return 422;
    // INVALID_TICKER y cualquier otro error de dominio son peticiones invalidas.
    default:
      return 400;
  }
}

/**
 * Convierte cualquier error en una respuesta HTTP segura y consistente para
 * los route handlers de la API.
 *
 * - Errores con `status` numerico adjunto (auth: 401/403, body invalido: 400)
 *   usan ese status y exponen su mensaje (controlado).
 * - `DomainError` mapea su `code` a un status y expone su `message` (seguro,
 *   pensado para mostrarse al usuario).
 * - Cualquier otro error se registra en el server y devuelve un 500 generico
 *   SIN filtrar el mensaje ni el stack trace al cliente.
 *
 * @param e - El error capturado.
 * @param context - Etiqueta de la ruta para el log del servidor (p.ej. "/api/quotes").
 */
export function mapApiError(e: unknown, context: string): NextResponse {
  const status = (e as { status?: unknown })?.status;
  if (typeof status === "number") {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status });
  }
  if (e instanceof DomainError) {
    return NextResponse.json(
      { error: e.message, code: e.code },
      { status: domainErrorStatus(e.code) },
    );
  }
  console.error(`${context} error:`, e);
  return NextResponse.json({ error: "internal server error" }, { status: 500 });
}

/**
 * Parsea el body JSON de un `Request`. Si el cuerpo esta vacio o malformado,
 * lanza un error con `status` 400 (en vez de dejar que el `JSON.parse` reviente
 * como 500). El caller debe enrutar el error a `mapApiError`.
 *
 * @param req - El request entrante.
 * @returns El JSON parseado como `unknown` (validar con Zod despues).
 */
export async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return (await req.json()) as unknown;
  } catch {
    throw Object.assign(new Error("invalid or empty JSON body"), { status: 400 });
  }
}
