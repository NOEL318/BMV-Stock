import { AnalysisLandingClient } from "./AnalysisLandingClient";

/**
 * Página de búsqueda de análisis — ingresa una emisora para ver su análisis completo.
 */
export default function AnalysisLandingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Análisis</h1>
        <p className="text-muted-foreground text-sm">
          Busca una emisora para ver su gráfica, indicadores técnicos y fundamentales.
        </p>
      </div>
      <AnalysisLandingClient />
    </div>
  );
}
