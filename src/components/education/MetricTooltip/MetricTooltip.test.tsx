import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricTooltip } from "./MetricTooltip";

describe("MetricTooltip", () => {
  it("renderiza el icono de ayuda cuando el concepto existe", async () => {
    await act(async () => {
      render(<MetricTooltip concept="rsi" />);
    });
    // El aria-label refleja el título del concepto (el trigger se renderiza como span)
    expect(screen.getByLabelText(/Información sobre RSI/i)).toBeInTheDocument();
  });

  it("no renderiza nada cuando el concepto no existe en el catálogo", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<MetricTooltip concept="concepto-inexistente-xyz" />));
    });
    // Cuando findConcept regresa undefined, el componente retorna null
    expect(container.firstChild).toBeNull();
  });
});
