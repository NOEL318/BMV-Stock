import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTable } from "./DataTable";
import type { ColumnDef } from "./DataTable.types";

interface Row {
  id: number;
  name: string;
  value: number;
}

const columns: ColumnDef<Row>[] = [
  { id: "name", header: "Nombre", accessorKey: "name" },
  { id: "value", header: "Valor", accessorKey: "value" },
];

const data: Row[] = [
  { id: 1, name: "Alpha", value: 10 },
  { id: 2, name: "Beta", value: 20 },
];

describe("DataTable", () => {
  it("renderiza headers y filas con datos simples", async () => {
    await act(async () => {
      render(<DataTable data={data} columns={columns} />);
    });

    // Encabezados
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Valor")).toBeInTheDocument();

    // Filas
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("click en header alterna sort asc/desc", async () => {
    await act(async () => {
      render(<DataTable data={data} columns={columns} sortable />);
    });

    const nameHeader = screen.getByText("Nombre").closest("th")!;

    // Primer click => asc (Alpha primero)
    await act(async () => {
      fireEvent.click(nameHeader);
    });
    const rowsAfterAsc = screen.getAllByRole("row").slice(1); // ignorar header
    expect(rowsAfterAsc[0]).toHaveTextContent("Alpha");

    // Segundo click => desc (Beta primero)
    await act(async () => {
      fireEvent.click(nameHeader);
    });
    const rowsAfterDesc = screen.getAllByRole("row").slice(1);
    expect(rowsAfterDesc[0]).toHaveTextContent("Beta");
  });

  it("muestra emptyState cuando data está vacío", async () => {
    await act(async () => {
      render(<DataTable data={[]} columns={columns} emptyState={<p>Sin registros</p>} />);
    });

    expect(screen.getByText("Sin registros")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
