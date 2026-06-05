import { z } from "zod";

/**
 * Schema del body para POST /api/paper-trading/trades.
 */
export const executePaperTradeSchema = z.object({
  ticker: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "El ticker es obligatorio")
    .max(20, "Máximo 20 caracteres"),
  exchange: z.enum(["BMV", "SIC"]),
  action: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  /** Si null, el server usa el último precio del cache de cotizaciones. */
  priceMxn: z.number().positive("El precio debe ser mayor a 0").nullable().default(null),
  notes: z.string().max(500, "Máximo 500 caracteres").nullable().default(null),
});

/** Tipo inferido del schema de paper trade (output/parsed). */
export type ExecutePaperTradeInput = z.infer<typeof executePaperTradeSchema>;

/** Tipo de entrada del form antes de los defaults de Zod. */
export type ExecutePaperTradeFormInput = z.input<typeof executePaperTradeSchema>;
