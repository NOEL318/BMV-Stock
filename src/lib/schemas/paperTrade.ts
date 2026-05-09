import { z } from "zod";

/**
 * Schema del body para POST /api/paper-trading/trades.
 */
export const executePaperTradeSchema = z.object({
  ticker: z.string().min(1).max(20),
  exchange: z.enum(["BMV", "SIC"]),
  action: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive(),
  /** Si null, el server usa el último precio del cache de cotizaciones. */
  priceMxn: z.number().positive().nullable().default(null),
  notes: z.string().max(500).nullable().default(null),
});

/** Tipo inferido del schema de paper trade (output/parsed). */
export type ExecutePaperTradeInput = z.infer<typeof executePaperTradeSchema>;

/** Tipo de entrada del form antes de los defaults de Zod. */
export type ExecutePaperTradeFormInput = z.input<typeof executePaperTradeSchema>;
