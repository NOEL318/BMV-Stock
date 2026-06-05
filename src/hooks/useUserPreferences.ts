import { useQuery } from "@tanstack/react-query";

import type { UserPreferences } from "@/domain/entities/UserPreferences";

interface PreferencesResponse {
  preferences: UserPreferences;
}

/**
 * Hook que consulta GET /api/user-preferences. Cachea con TanStack Query.
 * El resultado incluye `preferences` con todos los campos del usuario, incluyendo
 * `disclaimerAcceptedAt` que puede ser `null` si el usuario no ha aceptado aún.
 */
export function useUserPreferences() {
  return useQuery<PreferencesResponse>({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/user-preferences");
      if (!res.ok) throw new Error("failed to fetch preferences");
      return res.json() as Promise<PreferencesResponse>;
    },
    // Las preferencias casi nunca cambian y solo lo hacen por acción explícita
    // del usuario (que ya invalida la query). Evitamos refetch agresivo.
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
