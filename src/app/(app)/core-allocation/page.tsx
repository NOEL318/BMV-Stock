import { CoreAllocationClient } from "./CoreAllocationClient";

/**
 * Página de la calculadora de asignación de núcleo. Thin Server Component.
 */
export default function CoreAllocationPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Núcleo aburrido</h1>
        <p className="text-muted-foreground text-sm">
          Recomendación de asignación base en ETFs según tu perfil de riesgo. La parte
          estadísticamente más rentable de tu portafolio.
        </p>
      </div>
      <CoreAllocationClient />
    </div>
  );
}
