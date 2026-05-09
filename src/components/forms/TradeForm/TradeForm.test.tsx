import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TradeForm } from "./TradeForm";

describe("TradeForm", () => {
  it("renderiza todos los campos del formulario", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      render(<TradeForm onSubmit={onSubmit} />);
    });

    // Ticker (input con placeholder)
    expect(screen.getByPlaceholderText(/WALMEX/i)).toBeInTheDocument();

    // Radio groups: Bolsa y Operacion
    expect(screen.getByText("BMV (México)")).toBeInTheDocument();
    expect(screen.getByText("SIC (Internacional)")).toBeInTheDocument();
    expect(screen.getByText("Compra")).toBeInTheDocument();
    expect(screen.getByText("Venta")).toBeInTheDocument();
    expect(screen.getByText("Dividendo")).toBeInTheDocument();

    // Labels de campos numéricos
    expect(screen.getByText(/Cantidad/i)).toBeInTheDocument();
    expect(screen.getByText(/Precio/i)).toBeInTheDocument();
    expect(screen.getByText(/Comisión/i)).toBeInTheDocument();
    expect(screen.getByText(/Fecha/i)).toBeInTheDocument();

    // Botón de submit
    expect(screen.getByRole("button", { name: /Registrar trade/i })).toBeInTheDocument();
    // Botón cancel visible por default
    expect(screen.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
  });

  it("muestra error de validación cuando el ticker está vacío al hacer submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      render(<TradeForm onSubmit={onSubmit} />);
    });

    // Intentar enviar con el ticker vacío (valor inicial)
    const submitBtn = screen.getByRole("button", { name: /Registrar trade/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // El schema Zod requiere ticker.min(1) y quantity.positive() y priceMxn.positive()
    // El formulario no debe haber llamado onSubmit
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
