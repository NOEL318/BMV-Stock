import { z } from "zod";

/**
 * Schema del body para POST /api/portfolio/trades.
 * Reusable en el frontend para validación del form.
 */
export const recordTradeSchema = z.object({
  ticker: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "El ticker es obligatorio")
    .max(20, "Máximo 20 caracteres"),
  exchange: z.enum(["BMV", "SIC"]),
  action: z.enum(["BUY", "SELL", "DIVIDEND"]),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  priceMxn: z.number().positive("El precio debe ser mayor a 0"),
  commissionMxn: z.number().min(0, "La comisión no puede ser negativa").default(0),
  executedAt: z.coerce
    .date()
    .refine((d) => d.getTime() <= Date.now(), "La fecha no puede ser futura"),
  notes: z.string().max(500, "Máximo 500 caracteres").nullable().default(null),
});

/** Tipo inferido del schema de trade real (output/parsed). */
export type RecordTradeInput = z.infer<typeof recordTradeSchema>;

/** Tipo de entrada del form antes de la coerción/defaults de Zod. */
export type RecordTradeFormInput = z.input<typeof recordTradeSchema>;
