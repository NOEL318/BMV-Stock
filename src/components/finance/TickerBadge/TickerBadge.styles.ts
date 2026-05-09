import { cva } from "class-variance-authority";

/**
 * Variantes CVA para `TickerBadge`. Combina tamaño y tint por exchange.
 */
export const tickerBadgeVariants = cva(
  "inline-flex items-center rounded border font-mono font-semibold uppercase tracking-tight",
  {
    variants: {
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2 py-0.5 text-sm",
        lg: "px-2.5 py-1 text-base",
      },
      exchange: {
        BMV: "border-emerald-500/30 bg-emerald-500/10",
        SIC: "border-blue-500/30 bg-blue-500/10",
        none: "border-border bg-muted",
      },
    },
    defaultVariants: { size: "md", exchange: "none" },
  },
);
