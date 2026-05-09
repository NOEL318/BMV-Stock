import { AnalysisPageClient } from "./AnalysisPageClient";

/**
 * Página de análisis de una emisora específica.
 * Recibe el ticker como parámetro dinámico de la URL.
 */
export default async function TickerAnalysisPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <AnalysisPageClient ticker={decodeURIComponent(ticker)} />
    </div>
  );
}
