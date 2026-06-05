import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { removeFromWatchlist } from "@/application/watchlist/removeFromWatchlist";
import { requireUserId } from "@/infrastructure/auth/clerk";
import { mapApiError } from "@/lib/api-errors";

/**
 * DELETE /api/watchlist/[id] — elimina un item del watchlist. Idempotente.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const { watchlist } = getDeps();
    await removeFromWatchlist({ id, userId, repo: watchlist });
    return NextResponse.json({ success: true });
  } catch (e) {
    return mapApiError(e, "/api/watchlist/[id] DELETE");
  }
}
