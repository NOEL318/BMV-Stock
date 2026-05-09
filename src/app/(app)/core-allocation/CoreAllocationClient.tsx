"use client";

import { useState } from "react";

import type { AllocationBucket } from "@/application/core-allocation/recommendAllocation";
import { ConceptCard } from "@/components/education/ConceptCard";
import { TickerBadge } from "@/components/finance/TickerBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/** Perfiles de riesgo disponibles en la calculadora. */
type RiskProfile = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";

/** Etiquetas en español para cada perfil de riesgo. */
const PROFILE_LABELS: Record<RiskProfile, string> = {
  CONSERVATIVE: "Conservador",
  MODERATE: "Moderado",
  AGGRESSIVE: "Agresivo",
};

/**
 * Client Component de la calculadora de asignación de núcleo.
 * Permite seleccionar un perfil de riesgo y solicitar una recomendación
 * de asignación base en ETFs via POST a `/api/core-allocation`.
 * Muestra cada bucket en un Card y al final incluye un ConceptCard educativo.
 */
export function CoreAllocationClient() {
  const [profile, setProfile] = useState<RiskProfile>("MODERATE");
  const [allocation, setAllocation] = useState<AllocationBucket[]>([]);
  const [loading, setLoading] = useState(false);

  /** Solicita la recomendación al servidor y actualiza el estado local. */
  async function handleCalculate(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch("/api/core-allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskProfile: profile }),
      });
      if (res.ok) {
        const body = (await res.json()) as { allocation: AllocationBucket[] };
        setAllocation(body.allocation);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tu perfil de riesgo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={profile}
            onValueChange={(v) => setProfile(v as RiskProfile)}
            className="flex gap-3"
          >
            {(Object.keys(PROFILE_LABELS) as RiskProfile[]).map((p) => (
              <div key={p} className="flex items-center gap-2">
                <RadioGroupItem value={p} id={`profile-${p}`} />
                <label htmlFor={`profile-${p}`} className="text-sm">
                  {PROFILE_LABELS[p]}
                </label>
              </div>
            ))}
          </RadioGroup>
          <Button onClick={handleCalculate} disabled={loading}>
            {loading ? "Calculando..." : "Ver recomendación"}
          </Button>
        </CardContent>
      </Card>

      {allocation.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Asignación recomendada</h2>
          {allocation.map((b) => (
            <Card key={b.category}>
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">{b.label}</span>
                  <span className="font-mono text-2xl font-semibold">{b.percent}%</span>
                </div>
                <p className="text-muted-foreground text-xs">{b.rationale}</p>
                {b.suggestedTickers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {b.suggestedTickers.map((t) => (
                      <TickerBadge key={t} ticker={t} size="sm" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <ConceptCard concept="core-satellite" />
        </div>
      )}
    </div>
  );
}
