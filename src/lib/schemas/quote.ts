import { z } from "zod";

/**
 * Schema de query string para GET /api/quotes.
 */
export const quoteQuerySchema = z.object({
  ticker: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "El ticker es obligatorio")
    .max(20, "Máximo 20 caracteres"),
});

export type QuoteQuery = z.infer<typeof quoteQuerySchema>;
