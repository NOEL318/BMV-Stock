import { cva } from "class-variance-authority";

/**
 * Variantes CVA para celdas de la tabla genérica.
 */
export const tableCellVariants = cva("border-b border-border", {
  variants: {
    density: {
      compact: "px-2 py-1 text-xs",
      comfortable: "px-3 py-2 text-sm",
    },
  },
  defaultVariants: { density: "comfortable" },
});

/**
 * Variantes CVA para headers de la tabla genérica.
 */
export const tableHeaderVariants = cva(
  "border-b border-border bg-muted/50 text-left font-medium text-muted-foreground uppercase tracking-wider",
  {
    variants: {
      density: {
        compact: "px-2 py-1 text-[10px]",
        comfortable: "px-3 py-2 text-xs",
      },
      sortable: { true: "cursor-pointer select-none hover:bg-muted", false: "" },
    },
    defaultVariants: { density: "comfortable", sortable: false },
  },
);
