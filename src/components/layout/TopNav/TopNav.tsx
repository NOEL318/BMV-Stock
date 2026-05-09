"use client";

import { UserButton } from "@clerk/nextjs";
import { LuMoon, LuSun } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

import { topNavVariants } from "./TopNav.styles";
import type { TopNavProps } from "./TopNav.types";

/**
 * Barra superior con toggle de tema y `UserButton` de Clerk.
 * El toggle alterna entre light y dark; el modo "system" se setea desde Settings.
 */
export function TopNav({ className }: TopNavProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className={cn(topNavVariants(), className)}>
      <div className="text-muted-foreground text-sm">{/* Espacio para breadcrumbs futuros */}</div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Cambiar tema"
        >
          {isDark ? <LuSun className="h-4 w-4" /> : <LuMoon className="h-4 w-4" />}
        </Button>
        {/* En Clerk 7, afterSignOutUrl se configura en ClerkProvider, no en UserButton */}
        <UserButton />
      </div>
    </header>
  );
}
