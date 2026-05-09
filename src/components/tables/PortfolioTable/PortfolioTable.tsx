"use client";

import { usePortfolio } from "@/hooks/usePortfolio";

import { PortfolioTableView } from "../PortfolioTableView";

/**
 * Container que llama al hook `usePortfolio` y delega el render al view.
 * Se queda en el cliente porque consume el hook de TanStack Query.
 */
export function PortfolioTable() {
  const { data, isLoading, error } = usePortfolio();
  return (
    <PortfolioTableView
      data={data?.holdings ?? []}
      loading={isLoading}
      error={error ? (error instanceof Error ? error.message : "error desconocido") : null}
    />
  );
}
