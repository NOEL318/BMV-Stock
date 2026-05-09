import { cva } from "class-variance-authority";

/**
 * Variantes CVA para `MetricCard`. Combina tamaño, variante de fondo y énfasis.
 */
export const metricCardVariants = cva("flex flex-col gap-1 rounded-md transition-colors", {
  variants: {
    size: {
      sm: "p-2 text-sm",
      md: "p-3",
      lg: "p-4 text-lg",
    },
    variant: {
      bordered: "border bg-card",
      filled: "bg-muted",
      ghost: "bg-transparent",
    },
    emphasis: {
      neutral: "",
      positive: "border-emerald-500/30",
      negative: "border-destructive/30",
    },
  },
  defaultVariants: { size: "md", variant: "bordered", emphasis: "neutral" },
});
