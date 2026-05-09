import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MoneyDisplay } from "./MoneyDisplay";

describe("MoneyDisplay", () => {
  it("formatea con dos decimales y separador de miles por default", async () => {
    await act(async () => {
      render(<MoneyDisplay amount={1234.5} />);
    });
    expect(screen.getByText(/1,234\.50/)).toBeInTheDocument();
    expect(screen.getByText("MXN")).toBeInTheDocument();
  });

  it("respeta precision custom", async () => {
    await act(async () => {
      render(<MoneyDisplay amount={1.2345} precision={4} />);
    });
    expect(screen.getByText(/1\.2345/)).toBeInTheDocument();
  });

  it("muestra signo + cuando signed=true y amount positivo", async () => {
    await act(async () => {
      render(<MoneyDisplay amount={100} signed />);
    });
    expect(screen.getByText(/\+100\.00/)).toBeInTheDocument();
  });

  it("oculta currency cuando showCurrency=false", async () => {
    await act(async () => {
      render(<MoneyDisplay amount={50} showCurrency={false} />);
    });
    expect(screen.queryByText("MXN")).not.toBeInTheDocument();
  });

  it("aplica variant emphasis", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<MoneyDisplay amount={50} emphasis="positive" />));
    });
    expect(container.firstChild).toHaveClass("text-success");
  });
});
