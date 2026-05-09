import { cn } from "@/lib/utils";

import { moneyDisplayVariants } from "./MoneyDisplay.styles";
import type { MoneyDisplayProps } from "./MoneyDisplay.types";

/**
 * Renderiza una cantidad monetaria con formato `Intl.NumberFormat`,
 * tipografía mono tabular y soporte de variantes de énfasis (positivo,
 * negativo, neutral).
 */
export function MoneyDisplay({
  amount,
  currency = "MXN",
  precision = 2,
  showCurrency = true,
  signed = false,
  size = "md",
  emphasis = "neutral",
  className,
}: MoneyDisplayProps) {
  const formatter = new Intl.NumberFormat("es-MX", {
    style: "decimal",
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    signDisplay: signed ? "always" : "auto",
  });
  const formatted = formatter.format(amount);
  return (
    <span className={cn(moneyDisplayVariants({ size, emphasis }), className)}>
      {formatted}
      {showCurrency && <span className="text-muted-foreground ml-1 text-xs">{currency}</span>}
    </span>
  );
}
