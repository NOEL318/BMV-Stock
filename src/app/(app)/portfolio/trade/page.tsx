import { TradePageClient } from "./TradePageClient";

/**
 * Página de registro de trade real. Server Component que envuelve al Client Component.
 */
export default function TradePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Registrar trade</h1>
        <p className="text-muted-foreground text-sm">
          Captura el detalle de la operación que ejecutaste en GBM+.
        </p>
      </div>
      <TradePageClient />
    </div>
  );
}
