import Link from "next/link";

import { Button } from "@/components/ui/button";

import { PortfolioPageClient } from "./PortfolioPageClient";

/**
 * Página principal de Portafolio Real.
 * Server Component que renderiza el header + delega a un Client Component
 * para los datos dinámicos (vía hook usePortfolio).
 */
export default function PortfolioPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portafolio</h1>
          <p className="text-muted-foreground text-sm">
            Tus posiciones reales en GBM+ y su desempeño.
          </p>
        </div>
        <Button render={<Link href="/portfolio/trade" />} nativeButton={false}>
          Registrar trade
        </Button>
      </div>
      <PortfolioPageClient />
    </div>
  );
}
