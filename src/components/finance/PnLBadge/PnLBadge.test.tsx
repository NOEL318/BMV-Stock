import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PnLBadge } from "./PnLBadge";

describe("PnLBadge", () => {
  it("aplica color verde (text-success) para valor positivo", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<PnLBadge percent={0.05} />));
    });
    expect(container.firstChild).toHaveClass("text-success");
  });

  it("aplica color rojo (text-destructive) para valor negativo", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<PnLBadge percent={-0.03} />));
    });
    expect(container.firstChild).toHaveClass("text-destructive");
  });

  it("aplica color neutro cuando el valor es cero", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<PnLBadge percent={0} />));
    });
    expect(container.firstChild).toHaveClass("text-muted-foreground");
  });

  it("interpreta percentFormat='human' como 5 = 5%", async () => {
    await act(async () => {
      render(<PnLBadge percent={5} percentFormat="human" />);
    });
    // Con formato humano, 5 se muestra como +5.00%
    expect(screen.getByText(/\+5\.00%/)).toBeInTheDocument();
  });
});
