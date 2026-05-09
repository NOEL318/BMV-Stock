"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import type { HoldingWithQuote } from "@/application/portfolio/getHoldings";
import { ExchangeBadge } from "@/components/finance/ExchangeBadge";
import { MoneyDisplay } from "@/components/finance/MoneyDisplay";
import { PnLBadge } from "@/components/finance/PnLBadge";
import { TickerBadge } from "@/components/finance/TickerBadge";
import { Skeleton } from "@/components/ui/skeleton";

import { DataTable } from "../DataTable";

import type { PortfolioTableViewProps } from "./PortfolioTableView.types";

/**
 * Componente presentacional que renderiza una tabla de holdings con sus
 * cotizaciones. Recibe datos limpios; sin red ni state propio (el container
 * `PortfolioTable` se encarga de TanStack Query).
 */
export function PortfolioTableView({
  data,
  loading = false,
  error = null,
  className,
}: PortfolioTableViewProps) {
  const columns = useMemo<ColumnDef<HoldingWithQuote>[]>(
    () => [
      {
        id: "ticker",
        header: "Emisora",
        accessorFn: (row) => row.holding.ticker,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <TickerBadge
              ticker={row.original.holding.ticker}
              exchange={row.original.holding.exchange}
            />
            <ExchangeBadge exchange={row.original.holding.exchange} size="sm" />
          </div>
        ),
      },
      {
        id: "quantity",
        header: "Cantidad",
        accessorFn: (row) => row.holding.quantity,
        cell: ({ getValue }) => (
          <span className="font-mono tabular-nums">
            {(getValue() as number).toLocaleString("es-MX")}
          </span>
        ),
      },
      {
        id: "avgCost",
        header: "Costo prom.",
        accessorFn: (row) => row.holding.avgCostMxn,
        cell: ({ getValue }) => <MoneyDisplay amount={getValue() as number} size="sm" />,
      },
      {
        id: "price",
        header: "Precio actual",
        accessorFn: (row) => row.quote?.priceMxn ?? null,
        cell: ({ getValue }) => {
          const v = getValue() as number | null;
          return v === null ? (
            <span className="text-muted-foreground text-xs">sin datos</span>
          ) : (
            <MoneyDisplay amount={v} size="sm" />
          );
        },
      },
      {
        id: "marketValue",
        header: "Valor mercado",
        accessorFn: (row) => row.marketValueMxn,
        cell: ({ getValue }) => {
          const v = getValue() as number | null;
          return v === null ? (
            <span className="text-muted-foreground text-xs">sin datos</span>
          ) : (
            <MoneyDisplay amount={v} size="md" />
          );
        },
      },
      {
        id: "pnl",
        header: "P&L sin realizar",
        accessorFn: (row) => row.unrealizedPnLMxn,
        cell: ({ row }) => {
          const r = row.original;
          if (r.unrealizedPnLMxn === null || r.unrealizedPnLPercent === null) {
            return <span className="text-muted-foreground text-xs">—</span>;
          }
          return (
            <PnLBadge
              amount={r.unrealizedPnLMxn}
              percent={r.unrealizedPnLPercent}
              percentFormat="decimal"
              size="sm"
            />
          );
        },
      },
    ],
    [],
  );

  if (loading) {
    return (
      <div className={className}>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <div className={className}>
        <div className="border-destructive/30 text-destructive rounded-md border p-4 text-sm">
          Error al cargar el portafolio: {error}
        </div>
      </div>
    );
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      density="comfortable"
      emptyState={
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="font-medium">Tu portafolio está vacío</p>
          <p className="text-muted-foreground text-sm">
            Registra tu primer trade para empezar a llevar el control.
          </p>
        </div>
      }
      className={className}
    />
  );
}
