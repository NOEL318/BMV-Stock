import { cva } from "class-variance-authority";

/**
 * Variantes del contenedor del sidebar.
 * `expanded` reserva ancho fijo para labels; `compact` solo cabe iconos.
 */
export const sidebarVariants = cva(
  "flex h-full flex-col gap-1 border-r bg-card p-3 text-card-foreground",
  {
    variants: {
      variant: {
        // En móvil se muestra solo iconos (w-14); desde `md` se expande con labels.
        expanded: "w-14 md:w-56",
        compact: "w-14",
      },
    },
    defaultVariants: { variant: "expanded" },
  },
);

/**
 * Variantes de cada item del sidebar.
 * El estado activo lo aplica el componente al detectar match con la ruta.
 */
export const sidebarItemVariants = cva(
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
  {
    variants: {
      active: {
        true: "bg-muted text-foreground",
        false: "text-muted-foreground",
      },
      variant: {
        // Centrado (solo icono) en móvil; alineado a la izquierda con label en `md+`.
        expanded: "justify-center md:justify-start",
        compact: "justify-center",
      },
    },
    defaultVariants: { active: false, variant: "expanded" },
  },
);
