"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PaperTradeForm } from "@/components/forms/PaperTradeForm";
import type { ExecutePaperTradeInput } from "@/lib/schemas/paperTrade";

/**
 * Client Component que conecta PaperTradeForm con el endpoint POST /api/paper-trading/trades.
 * En éxito invalida el cache de paper portfolio y paper trades, luego redirige.
 */
export function PaperTradePageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleSubmit(data: ExecutePaperTradeInput): Promise<void> {
    const res = await fetch("/api/paper-trading/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        typeof body === "object" && body && "error" in body && typeof body.error === "string"
          ? body.error
          : "Error al ejecutar el paper trade";
      toast.error(message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["paper-portfolio"] });
    await queryClient.invalidateQueries({ queryKey: ["paper-trades"] });
    toast.success("Paper trade ejecutado");
    router.push("/paper-trading");
  }

  return <PaperTradeForm onSubmit={handleSubmit} onCancel={() => router.push("/paper-trading")} />;
}
