import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TickerBadge } from "./TickerBadge";

describe("TickerBadge", () => {
  it("renderiza el ticker en mayúsculas", async () => {
    await act(async () => {
      render(<TickerBadge ticker="WALMEX" />);
    });
    expect(screen.getByText("WALMEX")).toBeInTheDocument();
  });

  it("aplica tint de BMV cuando exchange='BMV'", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<TickerBadge ticker="WALMEX" exchange="BMV" />));
    });
    expect(container.firstChild).toHaveClass("bg-emerald-500/10");
    expect(container.firstChild).toHaveClass("border-emerald-500/30");
  });

  it("aplica tint de SIC y respeta size='lg'", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<TickerBadge ticker="AAPL" exchange="SIC" size="lg" />));
    });
    expect(container.firstChild).toHaveClass("bg-blue-500/10");
    expect(container.firstChild).toHaveClass("px-2.5");
  });
});
