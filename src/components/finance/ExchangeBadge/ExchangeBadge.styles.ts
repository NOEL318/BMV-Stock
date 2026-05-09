import { cva } from "class-variance-authority";

/**
 * Variantes CVA para `ExchangeBadge`. Combina tamaño y color por exchange.
 */
export const exchangeBadgeVariants = cva(
  "inline-flex items-center rounded-full font-medium uppercase tracking-wider",
  {
    variants: {
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2 py-0.5 text-xs",
      },
      exchange: {
        BMV: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        SIC: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
      },
    },
    defaultVariants: { size: "md" },
  },
);
