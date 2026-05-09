import { cva } from "class-variance-authority";

/**
 * Variantes CVA para `MoneyDisplay`. Combina tamaño y énfasis visual.
 */
export const moneyDisplayVariants = cva("font-mono tabular-nums", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-2xl font-semibold",
    },
    emphasis: {
      neutral: "text-foreground",
      positive: "text-success",
      negative: "text-destructive",
    },
  },
  defaultVariants: { size: "md", emphasis: "neutral" },
});
