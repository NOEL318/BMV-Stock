import { NextResponse } from "next/server";

import { getDeps } from "@/application/di";
import { removeFromWatchlist } from "@/application/watchlist/removeFromWatchlist";
import { requireUserId } from "@/infrastructure/auth/clerk";

/**
 * DELETE /api/watchlist/[id] — elimina un item del watchlist. Idempotente.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUserId();
    const { id } = await params;
    const { watchlist } = getDeps();
    await removeFromWatchlist({ id, repo: watchlist });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("/api/watchlist/[id] DELETE error:", e);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
