import type { IconType } from "react-icons";

/**
 * Estructura de un item del sidebar.
 * `icon` se acepta como componente de react-icons o cualquier IconType.
 */
export interface SidebarItem {
  href: string;
  label: string;
  icon: IconType;
}

export interface SidebarProps {
  items: SidebarItem[];
  /**
   * Variante visual del sidebar.
   * - `expanded`: muestra label + icon (default, \>=md).
   * - `compact`: solo icon, label en tooltip.
   */
  variant?: "expanded" | "compact";
  className?: string;
}
