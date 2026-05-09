"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { sidebarItemVariants, sidebarVariants } from "./Sidebar.styles";
import type { SidebarProps } from "./Sidebar.types";

/**
 * Sidebar de navegación principal.
 * Resalta el item activo comparando `pathname` con el `href` de cada item.
 */
export function Sidebar({ items, variant = "expanded", className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(sidebarVariants({ variant }), className)}>
      <div className="mb-4 px-3 py-2">
        <span className="font-semibold tracking-tight">
          {variant === "expanded" ? "BMV Stock" : "GC"}
        </span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={sidebarItemVariants({ active, variant })}
              aria-label={item.label}
            >
              <Icon aria-hidden className="h-4 w-4 shrink-0" />
              {variant === "expanded" && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
