import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SparkLine } from "./SparkLine";

describe("SparkLine", () => {
  it("renderiza un SVG con polyline cuando data tiene valores", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<SparkLine data={[10, 20, 15, 25, 18]} />));
    });
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    const polyline = svg?.querySelector("polyline");
    expect(polyline).not.toBeNull();
    // La polyline debe tener puntos generados
    expect(polyline?.getAttribute("points")).toBeTruthy();
  });

  it("no renderiza nada cuando data es un array vacío", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<SparkLine data={[]} />));
    });
    // Cuando data.length === 0, el componente retorna null
    expect(container.firstChild).toBeNull();
  });
});
