"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type InitialTableState,
  type SortingState,
  type TableOptions,
} from "@tanstack/react-table";
import { useState } from "react";
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { tableCellVariants, tableHeaderVariants } from "./DataTable.styles";
import type { DataTableProps } from "./DataTable.types";

/**
 * Tabla genérica reusable basada en `@tanstack/react-table`.
 * No conoce el dominio: las columnas se definen en cada uso.
 *
 * Soporta ordenamiento por click en header y paginación opcional.
 *
 * @typeParam T - Tipo de cada fila de datos.
 */
export function DataTable<T>({
  data,
  columns,
  sortable = true,
  pagination = null,
  emptyState,
  density = "comfortable",
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Construir las opciones en dos pasos para respetar exactOptionalPropertyTypes:
  // las propiedades opcionales cuyo valor sería undefined se omiten en lugar de
  // asignarse explícitamente como undefined.
  const baseOptions = {
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  } satisfies Partial<TableOptions<T>>;

  const sortOptions = sortable ? { getSortedRowModel: getSortedRowModel() } : {};
  const pageOptions = pagination
    ? {
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: pagination.pageSize } } satisfies InitialTableState,
      }
    : {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = useReactTable<T>({ ...baseOptions, ...sortOptions, ...pageOptions } as any);

  if (data.length === 0 && emptyState) {
    return <div className={cn("rounded-md border", className)}>{emptyState}</div>;
  }

  return (
    <div className={cn("overflow-hidden rounded-md border", className)}>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const sortDir = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className={tableHeaderVariants({ density, sortable })}
                    onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortable &&
                        (sortDir === "asc" ? (
                          <LuArrowUp className="h-3 w-3" />
                        ) : sortDir === "desc" ? (
                          <LuArrowDown className="h-3 w-3" />
                        ) : (
                          <LuArrowUpDown className="h-3 w-3 opacity-30" />
                        ))}
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/30">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={tableCellVariants({ density })}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination && (
        <div className="border-border flex items-center justify-between gap-2 border-t px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
