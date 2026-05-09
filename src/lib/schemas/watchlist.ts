import { z } from "zod";

/**
 * Schema del body para POST /api/watchlist.
 */
export const addToWatchlistSchema = z.object({
  ticker: z.string().min(1).max(20),
  notes: z.string().max(500).nullable().default(null),
  alertPriceAbove: z.number().positive().nullable().default(null),
  alertPriceBelow: z.number().positive().nullable().default(null),
});

/** Tipo de entrada del form antes de la coerción/defaults de Zod. */
export type AddToWatchlistFormInput = z.input<typeof addToWatchlistSchema>;

/** Tipo inferido del schema de watchlist (output/parsed). */
export type AddToWatchlistData = z.infer<typeof addToWatchlistSchema>;
