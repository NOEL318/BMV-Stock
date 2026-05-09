import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { HoldingWithQuote } from "@/application/portfolio/getHoldings";

import { PortfolioTableView } from "./PortfolioTableView";

/** Fixture mínimo de HoldingWithQuote para pruebas. */
const mockHolding: HoldingWithQuote = {
  holding: {
    id: "h1",
    userId: "u1",
    ticker: "WALMEX",
    exchange: "BMV",
    quantity: 100,
    avgCostMxn: 70,
    openedAt: new Date("2024-01-01"),
    closedAt: null,
    notes: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  quote: {
    ticker: "WALMEX.MX",
    exchange: "BMV",
    priceMxn: 80,
    priceUsd: null,
    openMxn: 79,
    highMxn: 82,
    lowMxn: 78,
    volume: 1000000,
    asOf: new Date("2024-01-02"),
  },
  marketValueMxn: 8000,
  costBasisMxn: 7000,
  unrealizedPnLMxn: 1000,
  unrealizedPnLPercent: 0.142857,
};

describe("PortfolioTableView", () => {
  it("renderiza emptyState cuando data está vacío", async () => {
    await act(async () => {
      render(<PortfolioTableView data={[]} />);
    });
    expect(screen.getByText("Tu portafolio está vacío")).toBeInTheDocument();
  });

  it("renderiza un holding correctamente", async () => {
    await act(async () => {
      render(<PortfolioTableView data={[mockHolding]} />);
    });
    // El ticker debe aparecer en la tabla
    expect(screen.getByText("WALMEX")).toBeInTheDocument();
    // La cantidad formateada
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("muestra error state cuando se pasa error", async () => {
    await act(async () => {
      render(<PortfolioTableView data={[]} error="No se pudo conectar" />);
    });
    expect(screen.getByText(/No se pudo conectar/)).toBeInTheDocument();
    expect(screen.getByText(/Error al cargar el portafolio/)).toBeInTheDocument();
  });
});
