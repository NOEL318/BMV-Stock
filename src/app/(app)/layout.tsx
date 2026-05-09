import { DisclaimerModal } from "@/components/DisclaimerModal";
import { ConceptSidebar } from "@/components/layout/ConceptSidebar";
import { AppSidebar } from "@/components/layout/Sidebar/AppSidebar";
import { TickerTape } from "@/components/layout/TickerTape";
import { TopNav } from "@/components/layout/TopNav";

/**
 * Layout de la aplicación autenticada.
 *
 * Estructura:
 * - `TickerTape` arriba a todo lo ancho (estilo Wall Street).
 * - Debajo: sidebar izquierdo de navegación, área principal, sidebar derecho
 *   de glosario (colapsable). El área principal tiene el `TopNav` y el contenido.
 *
 * `DisclaimerModal` aparece bloqueante hasta que el usuario acepte; está fuera
 * del flujo principal.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex h-screen flex-col">
      <DisclaimerModal />
      <div className="ticker-tape">
        <TickerTape />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
        <ConceptSidebar />
      </div>
    </div>
  );
}
