/**
 * Preferencia de tema seleccionable por el usuario.
 * - `system`: sigue el `prefers-color-scheme` del sistema operativo.
 */
export type Theme = "light" | "dark" | "system";

/**
 * Tema efectivamente aplicado a la UI (resuelto desde la preferencia).
 * Cuando `theme = "system"`, este valor refleja el match media del sistema.
 */
export type ResolvedTheme = "light" | "dark";

/**
 * Valor expuesto por el `ThemeContext`.
 */
export interface ThemeContextValue {
  /** Preferencia configurada por el usuario. */
  theme: Theme;
  /** Tema actualmente aplicado a `<html>` (siempre `light` o `dark`). */
  resolvedTheme: ResolvedTheme;
  /** Cambia la preferencia. Persiste en cookie y aplica la clase a `<html>`. */
  setTheme: (theme: Theme) => void;
}
