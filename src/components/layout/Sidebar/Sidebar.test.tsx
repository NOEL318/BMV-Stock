import { act, render, screen } from "@testing-library/react";
// Nota: en react-icons v5, LuHome fue renombrado a LuHouse.
import { LuHouse, LuStar } from "react-icons/lu";
import { describe, expect, it, vi } from "vitest";

// next/link esta aliasado en vitest.config.ts a __mocks__/next/link.tsx,
// por lo que no necesita vi.mock() adicional.
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LuHouse },
    { href: "/watchlist", label: "Watchlist", icon: LuStar },
  ];

  it("renderiza todos los items con su label en variant expanded", async () => {
    await act(async () => {
      render(<Sidebar items={items} variant="expanded" />);
    });
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Watchlist")).toBeInTheDocument();
  });

  it("oculta labels en variant compact", async () => {
    await act(async () => {
      render(<Sidebar items={items} variant="compact" />);
    });
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Watchlist")).not.toBeInTheDocument();
  });

  it("marca el item activo segun el pathname actual", async () => {
    await act(async () => {
      render(<Sidebar items={items} />);
    });
    const dashboardLink = screen.getByLabelText("Dashboard");
    const watchlistLink = screen.getByLabelText("Watchlist");
    // El item activo aplica text-foreground (variante active:true).
    // Los items inactivos aplican text-muted-foreground (variante active:false).
    // No se usa "bg-muted" porque la clase base incluye "hover:bg-muted".
    expect(dashboardLink.className).toContain("text-foreground");
    expect(watchlistLink.className).toContain("text-muted-foreground");
  });
});
