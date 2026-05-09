"use client";

import { MetricCard } from "@/components/finance/MetricCard";
import { PortfolioTable } from "@/components/tables/PortfolioTable";
import { usePortfolio } from "@/hooks/usePortfolio";

/**
 * Client Component con las métricas agregadas y la tabla de holdings.
 * Reactivamente lee del hook usePortfolio.
 */
export function PortfolioPageClient() {
  const { data, isLoading } = usePortfolio();
  const metrics = data?.metrics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Valor de mercado"
          value={metrics?.totalMarketValueMxn ?? 0}
          format="currency"
          size="md"
        />
        <MetricCard
          label="Costo total"
          value={metrics?.totalCostBasisMxn ?? 0}
          format="currency"
          size="md"
        />
        <MetricCard
          label="P&L sin realizar"
          value={metrics?.totalUnrealizedPnLMxn ?? 0}
          format="currency"
          emphasis={(metrics?.totalUnrealizedPnLMxn ?? 0) >= 0 ? "positive" : "negative"}
          size="md"
        />
        <MetricCard
          label="Retorno"
          value={metrics?.totalUnrealizedPnLPercent ?? 0}
          format="percent"
          emphasis={(metrics?.totalUnrealizedPnLPercent ?? 0) >= 0 ? "positive" : "negative"}
          size="md"
        />
      </div>
      <PortfolioTable />
      {isLoading && (
        <p className="text-muted-foreground text-center text-sm">Cargando portafolio...</p>
      )}
    </div>
  );
}
