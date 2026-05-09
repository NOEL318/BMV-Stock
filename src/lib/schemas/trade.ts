import { z } from "zod";

/**
 * Schema del body para POST /api/portfolio/trades.
 * Reusable en el frontend para validación del form.
 */
export const recordTradeSchema = z.object({
  ticker: z.string().min(1).max(20),
  exchange: z.enum(["BMV", "SIC"]),
  action: z.enum(["BUY", "SELL", "DIVIDEND"]),
  quantity: z.number().positive(),
  priceMxn: z.number().positive(),
  commissionMxn: z.number().min(0).default(0),
  executedAt: z.coerce.date(),
  notes: z.string().max(500).nullable().default(null),
});

/** Tipo inferido del schema de trade real (output/parsed). */
export type RecordTradeInput = z.infer<typeof recordTradeSchema>;

/** Tipo de entrada del form antes de la coerción/defaults de Zod. */
export type RecordTradeFormInput = z.input<typeof recordTradeSchema>;
