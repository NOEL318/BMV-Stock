import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// lightweight-charts usa canvas real que no está disponible en jsdom.
// Se reemplaza la librería completa con un mock mínimo que registra llamadas.
vi.mock("lightweight-charts", () => {
  const mockSeries = {
    setData: vi.fn(),
    priceScale: () => ({ applyOptions: vi.fn() }),
  };
  const mockChart = {
    addSeries: vi.fn(() => mockSeries),
    timeScale: () => ({ fitContent: vi.fn(), borderColor: "" }),
    applyOptions: vi.fn(),
    remove: vi.fn(),
  };
  return {
    createChart: vi.fn(() => mockChart),
    ColorType: { Solid: "solid" },
    CandlestickSeries: {},
    LineSeries: {},
    HistogramSeries: {},
  };
});

import type { HistoricalPrice } from "@/domain/entities/HistoricalPrice";

import { PriceChart } from "./PriceChart";

/** Crea un HistoricalPrice de prueba. */
function makePrice(date: string, close: number): HistoricalPrice {
  return {
    ticker: "AMXL",
    exchange: "BMV",
    date: new Date(date),
    open: close - 1,
    high: close + 1,
    low: close - 2,
    close,
    volume: 1000,
  };
}

describe("PriceChart", () => {
  it("renderiza el contenedor sin crash con data vacía", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<PriceChart data={[]} />));
    });
    // Debe haber un div contenedor con la clase w-full
    const div = container.querySelector("div");
    expect(div).not.toBeNull();
  });

  it("renderiza el contenedor sin crash con datos reales", async () => {
    const data = [
      makePrice("2024-01-01", 100),
      makePrice("2024-01-02", 105),
      makePrice("2024-01-03", 103),
    ];
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <PriceChart data={data} type="candles" showVolume indicators={["sma20"]} />,
      ));
    });
    const div = container.querySelector("div");
    expect(div).not.toBeNull();
  });
});
