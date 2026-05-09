import { LuTriangleAlert } from "react-icons/lu";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Sección de disclaimer prominente antes del CTA final de la landing.
 * Advierte que el sistema es educativo y no constituye asesoría financiera.
 */
export function Disclaimer() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="flex gap-3 pt-6">
          <LuTriangleAlert
            className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400"
            aria-hidden
          />
          <div className="space-y-2 text-sm">
            <p className="font-semibold">No es asesoría financiera.</p>
            <p className="text-muted-foreground leading-relaxed">
              Este sistema es una herramienta educativa y de gestión personal. No constituye
              asesoría financiera, recomendación de inversión, ni intermediación bursátil. Las
              decisiones son responsabilidad exclusiva del usuario. Para asesoría profesional
              consulta a un asesor financiero certificado o a GBM México.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
