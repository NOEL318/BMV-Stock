"use client";

import {
  LuChartCandlestick,
  LuChartPie,
  LuCircleDollarSign,
  LuLayoutDashboard,
  LuListChecks,
  LuSettings,
  LuStar,
} from "react-icons/lu";

import { Sidebar } from "./Sidebar";
import type { SidebarItem } from "./Sidebar.types";

/**
 * Items de navegación de la aplicación autenticada.
 * Se definen aquí (en el componente cliente) para evitar pasar funciones
 * desde Server Components a Client Components, lo cual Next.js 16 no permite.
 */
const APP_SIDEBAR_ITEMS: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
  { href: "/portfolio", label: "Portafolio", icon: LuCircleDollarSign },
  { href: "/paper-trading", label: "Paper Trading", icon: LuListChecks },
  { href: "/watchlist", label: "Watchlist", icon: LuStar },
  { href: "/analysis", label: "Análisis", icon: LuChartCandlestick },
  { href: "/core-allocation", label: "Núcleo", icon: LuChartPie },
  { href: "/settings", label: "Ajustes", icon: LuSettings },
];

/**
 * Sidebar de la aplicación autenticada con los items de navegación predefinidos.
 * Este componente cliente evita el problema de serializar funciones (iconos)
 * desde el layout de servidor.
 */
export function AppSidebar() {
  return <Sidebar items={APP_SIDEBAR_ITEMS} variant="expanded" />;
}
