import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Cargar `.env.local` primero (Next.js convention) y `.env` como fallback.
// Por default, `dotenv/config` solo carga `.env`, lo cual deja indefinido
// `DATABASE_URL_UNPOOLED` cuando vive en `.env.local`.
config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "./src/infrastructure/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
  verbose: true,
  strict: true,
});
