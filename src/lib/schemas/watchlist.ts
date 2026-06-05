import { z } from "zod";

/**
 * Schema del body para POST /api/watchlist.
 */
export const addToWatchlistSchema = z.object({
  ticker: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "El ticker es obligatorio")
    .max(20, "Máximo 20 caracteres"),
  notes: z.string().max(500, "Máximo 500 caracteres").nullable().default(null),
  alertPriceAbove: z.number().positive("Debe ser mayor a 0").nullable().default(null),
  alertPriceBelow: z.number().positive("Debe ser mayor a 0").nullable().default(null),
});

/** Tipo de entrada del form antes de la coerción/defaults de Zod. */
export type AddToWatchlistFormInput = z.input<typeof addToWatchlistSchema>;

/** Tipo inferido del schema de watchlist (output/parsed). */
export type AddToWatchlistData = z.infer<typeof addToWatchlistSchema>;
