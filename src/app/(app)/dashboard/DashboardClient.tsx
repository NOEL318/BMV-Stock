"use client";

import Link from "next/link";

import { ExchangeBadge } from "@/components/finance/ExchangeBadge";
import { MetricCard } from "@/components/finance/MetricCard";
import { MoneyDisplay } from "@/components/finance/MoneyDisplay";
import { PnLBadge } from "@/components/finance/PnLBadge";
import { TickerBadge } from "@/components/finance/TickerBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/hooks/useDashboard";

/**
 * Client del dashboard. Consume useDashboard y pinta:
 * - 4 MetricCards con benchmarks (IPC, USD/MXN, S&P 500, NASDAQ).
 * - Card de Portafolio Real (resumen + link).
 * - Card de Paper Portfolio (resumen + link).
 * - Card de Watchlist (mini lista, primeras 5 emisoras).
 * - Card de Últimos Trades.
 */
export function DashboardClient() {
  const { data, isLoading, error, refetch } = useDashboard();

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Cargando dashboard...</p>;
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <p className="text-destructive text-sm">No se pudo cargar el dashboard.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { marketSnapshot, portfolio, paperPortfolio, watchlist, recentTrades } = data;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-muted-foreground mb-3 text-sm font-medium tracking-wide uppercase">
          Mercado
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard
            label="IPC"
            value={marketSnapshot.ipc.priceMxn}
            format="number"
            precision={2}
          />
          <MetricCard
            label="USD/MXN"
            value={marketSnapshot.usdMxn.priceMxn}
            format="number"
            precision={4}
          />
          <MetricCard
            label="S&P 500"
            value={marketSnapshot.sp500.priceMxn}
            format="number"
            precision={2}
          />
          <MetricCard
            label="NASDAQ"
            value={marketSnapshot.nasdaq.priceMxn}
            format="number"
            precision={2}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Portafolio Real</CardTitle>
            <Button
              render={<Link href="/portfolio" />}
              variant="ghost"
              size="sm"
              nativeButton={false}
            >
              Ver detalle
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground text-xs">Valor de mercado:</span>
              <MoneyDisplay amount={portfolio.metrics.totalMarketValueMxn} size="md" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground text-xs">P&amp;L:</span>
              <PnLBadge
                amount={portfolio.metrics.totalUnrealizedPnLMxn}
                percent={portfolio.metrics.totalUnrealizedPnLPercent}
                percentFormat="decimal"
                size="sm"
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {portfolio.holdings.length}{" "}
              {portfolio.holdings.length === 1 ? "posición activa" : "posiciones activas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Paper Trading</CardTitle>
            <Button
              render={<Link href="/paper-trading" />}
              variant="ghost"
              size="sm"
              nativeButton={false}
            >
              Ver detalle
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {paperPortfolio ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground text-xs">Equity total:</span>
                  <MoneyDisplay amount={paperPortfolio.totalEquityMxn} size="md" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground text-xs">Retorno:</span>
                  <PnLBadge
                    amount={paperPortfolio.totalReturnMxn}
                    percent={paperPortfolio.totalReturnPercent}
                    percentFormat="decimal"
                    size="sm"
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  {paperPortfolio.positions.length}{" "}
                  {paperPortfolio.positions.length === 1
                    ? "posición simulada"
                    : "posiciones simuladas"}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                No tienes paper portfolio aún. Hacer tu primer trade lo creará.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Watchlist</CardTitle>
          <Button
            render={<Link href="/watchlist" />}
            variant="ghost"
            size="sm"
            nativeButton={false}
          >
            Ver toda
          </Button>
        </CardHeader>
        <CardContent>
          {watchlist.length === 0 ? (
            <p className="text-muted-foreground text-sm">No has agregado emisoras al watchlist.</p>
          ) : (
            <ul className="space-y-2">
              {watchlist.slice(0, 5).map(({ item, quote }) => (
                <li key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TickerBadge ticker={item.ticker} exchange={item.exchange} />
                    <ExchangeBadge exchange={item.exchange} size="sm" />
                  </div>
                  {quote ? (
                    <MoneyDisplay amount={quote.priceMxn} size="sm" />
                  ) : (
                    <span className="text-muted-foreground text-xs">sin datos</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos trades</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aún no has registrado trades reales.</p>
          ) : (
            <ul className="space-y-2">
              {recentTrades.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TickerBadge ticker={t.ticker} exchange={t.exchange} />
                    <span
                      className={
                        t.action === "BUY"
                          ? "text-success text-xs font-medium"
                          : t.action === "SELL"
                            ? "text-destructive text-xs font-medium"
                            : "text-muted-foreground text-xs font-medium"
                      }
                    >
                      {t.action}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(t.executedAt).toLocaleDateString("es-MX")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
