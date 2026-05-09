import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConceptCard } from "./ConceptCard";

describe("ConceptCard", () => {
  it("renderiza título y explicación cuando el concepto existe", async () => {
    await act(async () => {
      render(<ConceptCard concept="rsi" />);
    });
    // El título del concepto RSI debe aparecer
    expect(screen.getByText(/RSI/i)).toBeInTheDocument();
    // La explicación larga también debe estar presente
    expect(screen.getByText(/Wilder/i)).toBeInTheDocument();
  });

  it("no renderiza nada cuando el concepto no existe en el catálogo", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<ConceptCard concept="concepto-inexistente-xyz" />));
    });
    expect(container.firstChild).toBeNull();
  });
});
