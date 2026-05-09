import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";

import type { ResolvedTheme, Theme } from "@/contexts/ThemeContext";

import { Providers } from "./providers";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BMV Stock",
  description: "Tu copiloto de inversión en BMV y SIC",
};

/**
 * Conjunto de valores válidos para la cookie de preferencia.
 */
const VALID_THEME_PREFERENCES: readonly Theme[] = ["light", "dark", "system"];

/**
 * Lee la preferencia y el tema resuelto de las cookies del request.
 * Si no hay cookie o el valor es inválido, usa los defaults `system` / `light`.
 * Esto permite aplicar la clase `dark` a `<html>` durante SSR y evitar el
 * flash al cargar la página.
 */
async function readThemeFromCookies(): Promise<{
  preference: Theme;
  resolved: ResolvedTheme;
}> {
  const store = await cookies();
  const preferenceRaw = store.get("theme-preference")?.value;
  const resolvedRaw = store.get("theme-resolved")?.value;

  const preference: Theme = VALID_THEME_PREFERENCES.includes(preferenceRaw as Theme)
    ? (preferenceRaw as Theme)
    : "system";
  const resolved: ResolvedTheme = resolvedRaw === "dark" ? "dark" : "light";

  return { preference, resolved };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { preference, resolved } = await readThemeFromCookies();

  return (
    <html lang="es" className={resolved} suppressHydrationWarning>
      <body className={`${inter.variable} ${jetBrainsMono.variable} font-sans antialiased`}>
        <Providers initialThemePreference={preference} initialResolvedTheme={resolved}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
