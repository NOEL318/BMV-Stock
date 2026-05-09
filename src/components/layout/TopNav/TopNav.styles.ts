import { cva } from "class-variance-authority";

/**
 * Variantes del contenedor de la barra superior.
 */
export const topNavVariants = cva(
  "flex h-14 items-center justify-between border-b bg-background px-4",
);
