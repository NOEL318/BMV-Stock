import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExchangeBadge } from "./ExchangeBadge";

describe("ExchangeBadge", () => {
  it("renderiza el texto BMV con tint verde", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<ExchangeBadge exchange="BMV" />));
    });
    expect(screen.getByText("BMV")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-emerald-500/15");
  });

  it("renderiza el texto SIC con tint azul", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<ExchangeBadge exchange="SIC" />));
    });
    expect(screen.getByText("SIC")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-blue-500/15");
  });
});
