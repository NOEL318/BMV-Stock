import { PaperTradeHistoryClient } from "./PaperTradeHistoryClient";

/**
 * Página de historial de paper trades. Server Component que envuelve al Client Component.
 */
export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Historial de paper trades</h1>
        <p className="text-muted-foreground text-sm">
          Todos los trades simulados que has ejecutado.
        </p>
      </div>
      <PaperTradeHistoryClient />
    </div>
  );
}
