"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { LuCircleHelp } from "react-icons/lu";

import { findConcept } from "@/lib/concepts";
import { cn } from "@/lib/utils";

import type { MetricTooltipProps } from "./MetricTooltip.types";

/**
 * Pequeño icono de ayuda que al hover muestra una explicación corta del
 * concepto financiero. Si el concepto no existe en el catálogo, no renderiza nada.
 */
export function MetricTooltip({ concept, size = "sm", className }: MetricTooltipProps) {
  const def = findConcept(concept);
  if (!def) return null;

  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <Tooltip.Provider delay={200}>
      <Tooltip.Root>
        <Tooltip.Trigger
          className={cn(
            "text-muted-foreground hover:text-foreground inline-flex cursor-help",
            className,
          )}
          aria-label={`Información sobre ${def.title}`}
          render={<span />}
        >
          <LuCircleHelp className={iconClass} />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner side="top" sideOffset={4}>
            <Tooltip.Popup className="bg-popover text-popover-foreground ring-foreground/10 z-50 max-w-xs rounded-md px-3 py-2 text-xs ring-1">
              <div className="space-y-1">
                <p className="font-semibold">{def.title}</p>
                <p className="leading-relaxed">{def.shortExplanation}</p>
              </div>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
