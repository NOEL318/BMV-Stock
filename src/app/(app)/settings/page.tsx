import { SettingsPageClient } from "./SettingsPageClient";

/**
 * Página de ajustes del usuario. Thin Server Component que delega al Client Component.
 */
export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground text-sm">Personaliza cómo ves la app.</p>
      </div>
      <SettingsPageClient />
    </div>
  );
}
