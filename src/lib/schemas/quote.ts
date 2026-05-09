import { z } from "zod";

/**
 * Schema de query string para GET /api/quotes.
 */
export const quoteQuerySchema = z.object({
  ticker: z.string().min(1).max(20),
});

export type QuoteQuery = z.infer<typeof quoteQuerySchema>;
