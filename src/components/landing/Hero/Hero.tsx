import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Sección hero de la landing: título grande, descripción y CTA principal.
 * El botón usa polimorfismo de base-ui via `render` + `nativeButton={false}`.
 */
export function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 text-center">
      <h1 className="mb-4 text-5xl font-semibold tracking-tight">BMV Stock</h1>
      <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
        Tu copiloto personal de inversión en BMV y SIC. Análisis con tooltips educativos, paper
        trading sin riesgo, y gestión de portafolio — todo en un solo lugar.
      </p>
      <div className="flex justify-center gap-3">
        <Button render={<Link href="/sign-in" />} size="lg" nativeButton={false}>
          Iniciar sesión
        </Button>
      </div>
    </section>
  );
}
