import type { RiskProfile } from "@/domain/entities/UserPreferences";

/**
 * Una recomendación de asignación: par (categoría, porcentaje, ETFs sugeridos).
 */
export interface AllocationBucket {
  category: "BMV-EQUITY" | "INTL-EQUITY" | "BONDS" | "CASH";
  label: string;
  percent: number;
  suggestedTickers: string[];
  rationale: string;
}

/**
 * Tabla estática que mapea perfil de riesgo a porcentajes de cada categoría.
 * Estos valores son guías generales — la spec señala que la lista exacta
 * de ETFs disponibles vía SIC en GBM+ se confirma en producción.
 */
const ALLOCATIONS: Record<RiskProfile, AllocationBucket[]> = {
  CONSERVATIVE: [
    {
      category: "BMV-EQUITY",
      label: "Renta variable mexicana",
      percent: 20,
      suggestedTickers: ["NAFTRAC.MX"],
      rationale: "Núcleo en el IPC vía NAFTRAC.",
    },
    {
      category: "INTL-EQUITY",
      label: "Renta variable internacional",
      percent: 30,
      suggestedTickers: ["VOO", "VTI"],
      rationale: "Diversificación amplia en EUA con TER bajo.",
    },
    {
      category: "BONDS",
      label: "Renta fija",
      percent: 40,
      suggestedTickers: ["BND", "AGG"],
      rationale: "Estabilidad y descorrelación en mercados bajistas.",
    },
    {
      category: "CASH",
      label: "Liquidez",
      percent: 10,
      suggestedTickers: [],
      rationale: "Reserva para oportunidades y emergencias.",
    },
  ],
  MODERATE: [
    {
      category: "BMV-EQUITY",
      label: "Renta variable mexicana",
      percent: 25,
      suggestedTickers: ["NAFTRAC.MX"],
      rationale: "Núcleo en el IPC.",
    },
    {
      category: "INTL-EQUITY",
      label: "Renta variable internacional",
      percent: 50,
      suggestedTickers: ["VOO", "VTI", "VXUS"],
      rationale: "Mayor exposición global, balance EUA + ex-EUA.",
    },
    {
      category: "BONDS",
      label: "Renta fija",
      percent: 20,
      suggestedTickers: ["BND"],
      rationale: "Amortigua la volatilidad.",
    },
    {
      category: "CASH",
      label: "Liquidez",
      percent: 5,
      suggestedTickers: [],
      rationale: "Pequeña reserva táctica.",
    },
  ],
  AGGRESSIVE: [
    {
      category: "BMV-EQUITY",
      label: "Renta variable mexicana",
      percent: 25,
      suggestedTickers: ["NAFTRAC.MX"],
      rationale: "Núcleo mexicano para reducir riesgo cambiario.",
    },
    {
      category: "INTL-EQUITY",
      label: "Renta variable internacional",
      percent: 65,
      suggestedTickers: ["VOO", "QQQ", "VTI", "VXUS"],
      rationale: "Mayor peso en equity con tilt hacia tecnología.",
    },
    {
      category: "BONDS",
      label: "Renta fija",
      percent: 5,
      suggestedTickers: ["BND"],
      rationale: "Pequeña posición defensiva.",
    },
    {
      category: "CASH",
      label: "Liquidez",
      percent: 5,
      suggestedTickers: [],
      rationale: "Mínimo operativo.",
    },
  ],
};

/**
 * Recomienda una asignación de núcleo para un perfil de riesgo dado.
 * La asignación es una guía general — el usuario debe consultar a un asesor
 * antes de operar. La suma de porcentajes siempre es 100.
 *
 * @param profile - Perfil de riesgo: CONSERVATIVE, MODERATE o AGGRESSIVE.
 * @returns Lista de buckets de asignación cuya suma de `percent` es 100.
 */
export function recommendAllocation(profile: RiskProfile): AllocationBucket[] {
  return ALLOCATIONS[profile];
}
