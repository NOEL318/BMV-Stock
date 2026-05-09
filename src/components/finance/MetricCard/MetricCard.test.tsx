import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("renderiza label y valor", async () => {
    await act(async () => {
      render(<MetricCard label="Valor de mercado" value={50000} />);
    });
    expect(screen.getByText("Valor de mercado")).toBeInTheDocument();
    // El número debe estar presente en el DOM (separador de miles)
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  it("format='percent' multiplica el valor por 100 y agrega signo %", async () => {
    await act(async () => {
      render(<MetricCard label="Rendimiento" value={0.1234} format="percent" />);
    });
    expect(screen.getByText(/12\.34%/)).toBeInTheDocument();
  });

  it("format='currency' con precision=0 no muestra decimales", async () => {
    await act(async () => {
      render(<MetricCard label="Costo" value={75000} format="currency" precision={0} />);
    });
    expect(screen.getByText(/75,000/)).toBeInTheDocument();
    expect(screen.queryByText(/75,000\.00/)).not.toBeInTheDocument();
  });

  it("renderiza PnLBadge cuando se pasa delta", async () => {
    await act(async () => {
      render(<MetricCard label="P&L" value={500} delta={-50} />);
    });
    // PnLBadge muestra el monto con signo siempre
    expect(screen.getByText(/-50\.00/)).toBeInTheDocument();
  });
});
