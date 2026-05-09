import { currentUser } from "@clerk/nextjs/server";

import { DashboardClient } from "./DashboardClient";

/**
 * Dashboard real con market snapshot, mini portfolio, paper portfolio,
 * watchlist, últimos trades. Server Component que saluda y delega a Client.
 */
export default async function DashboardPage() {
  const user = await currentUser();
  const greeting = user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "inversionista";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {greeting}</h1>
        <p className="text-muted-foreground text-sm">
          Resumen general de tus inversiones y el mercado.
        </p>
      </div>
      <DashboardClient />
    </div>
  );
}
