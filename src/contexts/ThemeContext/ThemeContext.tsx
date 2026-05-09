"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import type { ResolvedTheme, Theme, ThemeContextValue } from "./ThemeContext.types";

/**
 * Nombres de cookies usados para persistir el tema. La cookie `preference`
 * guarda la elección del usuario (light/dark/system); la cookie `resolved`
 * guarda el tema efectivo (light/dark) que el SSR aplicará a `<html>` en la
 * siguiente visita para evitar flicker.
 */
const PREFERENCE_COOKIE = "theme-preference";
const RESOLVED_COOKIE = "theme-resolved";

/**
 * 365 días — el tema persiste a través de sesiones.
 */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Aplica o remueve la clase `dark` en el elemento `html`.
 */
function applyClass(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

/**
 * Escribe una cookie con `path=/`, `samesite=lax` y `max-age` largo.
 */
function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

/**
 * Suscribe a cambios en `prefers-color-scheme` del sistema operativo.
 * Devuelve la función para desuscribir.
 */
function subscribeSystemTheme(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/**
 * Lectura sincrónica del estado actual del sistema.
 * Para SSR se usa el valor inicial provisto por la cookie en su lugar.
 */
function getSystemThemeSnapshot(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Props del Provider. Los valores `initial*` los provee el root layout
 * leyendo cookies en el server. Esto permite que el SSR aplique la clase
 * correcta a `<html>` antes de que React hidrate.
 */
export interface ThemeProviderProps {
  children: React.ReactNode;
  initialPreference: Theme;
  initialResolved: ResolvedTheme;
}

/**
 * Provider de tema basado en cookies.
 *
 * Diseño:
 * - El root layout (server) lee las cookies y aplica la clase a `<html>`,
 *   eliminando el flash al cargar la página.
 * - `useSyncExternalStore` suscribe reactivamente al matchMedia del sistema,
 *   evitando setState dentro de useEffect (anti-pattern en React 19).
 * - `resolvedTheme` se deriva sin estado propio: si la preferencia es
 *   `system`, viene del subscriber; si es explícita, viene de la preferencia.
 * - Un solo `useEffect` sincroniza la clase del DOM y la cookie cuando
 *   cambia el tema resuelto (side-effect externo, no setState).
 */
export function ThemeProvider({
  children,
  initialPreference,
  initialResolved,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialPreference);

  // Suscripción reactiva a la preferencia del sistema. Durante SSR se usa
  // `initialResolved` (que viene de la cookie) como server snapshot para
  // que la hidratación coincida con lo que pintó el server.
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    () => initialResolved,
  );

  // Derivado puro: si el usuario eligió "system", se sigue al sistema; si no,
  // se aplica la preferencia explícita.
  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  // Cuando el tema resuelto cambia (toggle del usuario o cambio del sistema),
  // sincronizar la clase del DOM y la cookie. Es un side-effect externo,
  // no un setState — válido dentro de useEffect.
  useEffect(() => {
    applyClass(resolvedTheme);
    setCookie(RESOLVED_COOKIE, resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme): void => {
    setThemeState(next);
    setCookie(PREFERENCE_COOKIE, next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de tema.
 *
 * @throws Error si se usa fuera de un `ThemeProvider`.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
