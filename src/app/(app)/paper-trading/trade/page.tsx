import { PaperTradePageClient } from "./PaperTradePageClient";

/**
 * Página de paper trade. Server Component que envuelve al Client Component.
 */
export default function PaperTradePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hacer paper trade</h1>
        <p className="text-muted-foreground text-sm">
          Compra o vende con dinero ficticio. No afecta tu cuenta real.
        </p>
      </div>
      <PaperTradePageClient />
    </div>
  );
}
