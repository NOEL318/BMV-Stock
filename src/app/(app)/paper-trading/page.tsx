import Link from "next/link";

import { Button } from "@/components/ui/button";

import { PaperTradingPageClient } from "./PaperTradingPageClient";

/**
 * Página principal de Paper Trading.
 * Server Component que renderiza el header + delega a un Client Component
 * para los datos dinámicos (vía hook usePaperPortfolio).
 */
export default function PaperTradingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Paper Trading</h1>
          <p className="text-muted-foreground text-sm">
            Practica con dinero ficticio antes de arriesgar capital real.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            render={<Link href="/paper-trading/history" />}
            variant="outline"
            nativeButton={false}
          >
            Historial
          </Button>
          <Button render={<Link href="/paper-trading/trade" />} nativeButton={false}>
            Hacer trade
          </Button>
        </div>
      </div>
      <PaperTradingPageClient />
    </div>
  );
}
