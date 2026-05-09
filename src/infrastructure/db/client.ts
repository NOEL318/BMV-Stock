import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/env";

import * as schema from "./schema";

/**
 * Cliente Drizzle con HTTP driver de Neon (compatible con edge/serverless).
 * Usa el `DATABASE_URL` con pooling para rutas de la app;
 * `DATABASE_URL_UNPOOLED` se reserva para migraciones.
 */
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export type Database = typeof db;
