"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ExchangeBadge } from "@/components/finance/ExchangeBadge";
import { MetricCard } from "@/components/finance/MetricCard";
import { MoneyDisplay } from "@/components/finance/MoneyDisplay";
import { PnLBadge } from "@/components/finance/PnLBadge";
import { TickerBadge } from "@/components/finance/TickerBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePaperPortfolio } from "@/hooks/usePaperPortfolio";

/**
 * Client Component que muestra las métricas y posiciones del paper portfolio.
 * Permite resetear el portfolio con confirmación.
 */
export function PaperTradingPageClient() {
  const { data, isLoading } = usePaperPortfolio();
  const queryClient = useQueryClient();

  async function handleReset(): Promise<void> {
    if (!window.confirm("¿Resetear el portafolio? Se perderán todos los trades simulados.")) {
      return;
    }
    const res = await fetch("/api/paper-trading/reset", { method: "POST" });
    if (!res.ok) {
      toast.error("Error al resetear");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["paper-portfolio"] });
    toast.success("Portafolio reseteado");
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Cargando...</p>;
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No tienes paper portfolio aún</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Tu primer trade va a inicializar tu portafolio simulado con $100,000 MXN ficticios.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Equity total" value={data.totalEquityMxn} format="currency" />
        <MetricCard
          label="Cash disponible"
          value={data.portfolio.cashBalanceMxn}
          format="currency"
        />
        <MetricCard
          label="Retorno"
          value={data.totalReturnMxn}
          format="currency"
          emphasis={data.totalReturnMxn >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Retorno %"
          value={data.totalReturnPercent}
          format="percent"
          emphasis={data.totalReturnPercent >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Posiciones</h2>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Resetear portafolio
          </Button>
        </div>
        {data.positions.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground text-sm">
                Aún no tienes posiciones. Tu primer trade aparecerá aquí.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">
                    Emisora
                  </th>
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">
                    Cantidad
                  </th>
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">
                    Costo prom.
                  </th>
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">
                    Valor mercado
                  </th>
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">
                    P&L
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.positions.map((p) => (
                  <tr key={p.position.id} className="border-border border-t">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <TickerBadge ticker={p.position.ticker} exchange={p.position.exchange} />
                        <ExchangeBadge exchange={p.position.exchange} size="sm" />
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-sm">
                      {p.position.quantity.toLocaleString("es-MX")}
                    </td>
                    <td className="px-3 py-2">
                      <MoneyDisplay amount={p.position.avgCostMxn} size="sm" />
                    </td>
                    <td className="px-3 py-2">
                      {p.marketValueMxn === null ? (
                        <span className="text-muted-foreground text-xs">sin datos</span>
                      ) : (
                        <MoneyDisplay amount={p.marketValueMxn} size="sm" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {p.unrealizedPnLMxn === null || p.unrealizedPnLPercent === null ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <PnLBadge
                          amount={p.unrealizedPnLMxn}
                          percent={p.unrealizedPnLPercent}
                          percentFormat="decimal"
                          size="sm"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
