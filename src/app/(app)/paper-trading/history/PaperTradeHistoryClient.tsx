"use client";

import { ExchangeBadge } from "@/components/finance/ExchangeBadge";
import { MoneyDisplay } from "@/components/finance/MoneyDisplay";
import { TickerBadge } from "@/components/finance/TickerBadge";
import { Card, CardContent } from "@/components/ui/card";
import { usePaperTrades } from "@/hooks/usePaperTrades";

/**
 * Client Component que lista todos los paper trades del usuario en una tabla.
 */
export function PaperTradeHistoryClient() {
  const { data, isLoading } = usePaperTrades();

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Cargando...</p>;
  }

  const trades = data?.trades ?? [];

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground text-sm">No has ejecutado paper trades todavía.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">Fecha</th>
            <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">Emisora</th>
            <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">
              Operación
            </th>
            <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">
              Cantidad
            </th>
            <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">Precio</th>
            <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">Total</th>
            <th className="text-muted-foreground px-3 py-2 text-left text-xs uppercase">Notas</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id} className="border-border border-t">
              <td className="px-3 py-2 text-sm">
                {new Date(t.executedAt).toLocaleString("es-MX")}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <TickerBadge ticker={t.ticker} exchange={t.exchange} />
                  <ExchangeBadge exchange={t.exchange} size="sm" />
                </div>
              </td>
              <td className="px-3 py-2">
                <span
                  className={
                    t.action === "BUY"
                      ? "text-success text-sm font-medium"
                      : "text-destructive text-sm font-medium"
                  }
                >
                  {t.action === "BUY" ? "Compra" : "Venta"}
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-sm">
                {Number(t.quantity).toLocaleString("es-MX")}
              </td>
              <td className="px-3 py-2">
                <MoneyDisplay amount={Number(t.priceMxn)} size="sm" />
              </td>
              <td className="px-3 py-2">
                <MoneyDisplay amount={Number(t.quantity) * Number(t.priceMxn)} size="sm" />
              </td>
              <td className="text-muted-foreground px-3 py-2 text-xs">{t.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
