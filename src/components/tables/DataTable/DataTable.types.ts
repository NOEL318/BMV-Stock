import type { ColumnDef } from "@tanstack/react-table";

export type { ColumnDef };

/**
 * Props del componente genérico DataTable.
 */
export interface DataTableProps<T> {
  /** Arreglo de datos a renderizar. */
  data: T[];
  /** Definiciones de columnas de TanStack Table. */
  columns: ColumnDef<T>[];
  /**
   * Habilita ordenamiento al click en header. Default `true`.
   */
  sortable?: boolean;
  /**
   * Si se provee, paginar con el tamaño dado. Si `null`, sin paginación. Default `null`.
   */
  pagination?: { pageSize: number } | null;
  /** Componente cuando data está vacío. */
  emptyState?: React.ReactNode;
  /** Densidad visual. */
  density?: "compact" | "comfortable";
  /** Clase CSS adicional para el wrapper. */
  className?: string | undefined;
}
