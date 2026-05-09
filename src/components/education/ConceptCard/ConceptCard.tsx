import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { findConcept } from "@/lib/concepts";
import { cn } from "@/lib/utils";

import type { ConceptCardProps } from "./ConceptCard.types";

/**
 * Card detallada de un concepto financiero. Muestra título y explicación
 * extendida. Útil para una página de glosario o un drawer educativo.
 */
export function ConceptCard({ concept, className }: ConceptCardProps) {
  const def = findConcept(concept);
  if (!def) return null;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">{def.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm leading-relaxed">
        {def.longExplanation}
      </CardContent>
    </Card>
  );
}
