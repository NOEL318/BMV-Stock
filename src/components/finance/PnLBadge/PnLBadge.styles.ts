import { cva } from "class-variance-authority";

/**
 * Variantes CVA para `PnLBadge`. Combina tamaño y color por signo del P&L.
 */
export const pnlBadgeVariants = cva("inline-flex items-center gap-1 font-medium tabular-nums", {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
    sign: {
      positive: "text-success",
      negative: "text-destructive",
      neutral: "text-muted-foreground",
    },
  },
  defaultVariants: { size: "md", sign: "neutral" },
});
