import type { SuggestedTickerData } from "@/application/suggestions/getSuggestedTickersData";

/**
 * Layout de la card. `vertical` apila ticker → precio → sparkline (default).
 * `horizontal` distribuye en fila: ticker | precio | sparkline.
 */
export type SuggestedTickerCardLayout = "vertical" | "horizontal";

/**
 * Props del `SuggestedTickerCard`.
 */
export interface SuggestedTickerCardProps {
  data: SuggestedTickerData;
  layout?: SuggestedTickerCardLayout;
  className?: string;
}
