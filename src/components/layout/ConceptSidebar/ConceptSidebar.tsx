"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { LuBookOpen, LuChevronLeft, LuChevronRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { findConcept } from "@/lib/concepts";
import { getConceptsForRoute } from "@/lib/concepts/route-map";
import { cn } from "@/lib/utils";

import type { ConceptSidebarProps } from "./ConceptSidebar.types";

/**
 * Sidebar derecho colapsable que muestra los conceptos financieros
 * relevantes para la pantalla actual. Pensado para gente que está
 * aprendiendo a invertir: cada tarjeta da una explicación corta y
 * clara del término.
 *
 * No se renderiza si la ruta actual no tiene conceptos asociados
 * (ver `lib/concepts/route-map.ts`).
 */
export function ConceptSidebar({
  defaultCollapsed = false,
  className,
}: ConceptSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const slugs = getConceptsForRoute(pathname);

  if (slugs.length === 0) return null;

  return (
    <aside
      className={cn(
        "border-border bg-card flex h-full flex-col border-l transition-[width] duration-200",
        collapsed ? "w-10" : "w-72",
        className,
      )}
    >
      <div className="border-border flex items-center justify-between border-b p-2">
        {!collapsed && (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 px-2 text-[10px] font-medium tracking-wider uppercase">
            <LuBookOpen className="h-3 w-3" aria-hidden />
            Glosario
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir glosario" : "Colapsar glosario"}
        >
          {collapsed ? (
            <LuChevronLeft className="h-4 w-4" />
          ) : (
            <LuChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!collapsed && (
        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          {slugs.map((slug) => {
            const concept = findConcept(slug);
            if (!concept) return null;
            return (
              <Card key={slug} className="border-border/60">
                <CardContent className="space-y-1 p-3">
                  <h3 className="text-sm font-semibold tracking-tight">{concept.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {concept.shortExplanation}
                  </p>
                </CardContent>
              </Card>
            );
          })}
          <p className="text-muted-foreground/70 px-1 pt-2 text-[10px] leading-relaxed">
            Estas explicaciones son resúmenes para introducirte al concepto. No son asesoría
            financiera.
          </p>
        </div>
      )}
    </aside>
  );
}
