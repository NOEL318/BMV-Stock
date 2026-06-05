"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { TradeForm } from "@/components/forms/TradeForm";
import { invalidateAfterRealTrade } from "@/hooks/invalidate";
import type { RecordTradeInput } from "@/lib/schemas/trade";

/**
 * Client Component que conecta TradeForm con el endpoint POST /api/portfolio/trades.
 * En éxito invalida el cache de portfolio y redirige.
 */
export function TradePageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleSubmit(data: RecordTradeInput): Promise<void> {
    const res = await fetch("/api/portfolio/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        typeof body === "object" && body && "error" in body && typeof body.error === "string"
          ? body.error
          : "Error al registrar el trade";
      toast.error(message);
      return;
    }
    await invalidateAfterRealTrade(queryClient);
    toast.success("Trade registrado correctamente");
    router.push("/portfolio");
  }

  return <TradeForm onSubmit={handleSubmit} onCancel={() => router.push("/portfolio")} />;
}
