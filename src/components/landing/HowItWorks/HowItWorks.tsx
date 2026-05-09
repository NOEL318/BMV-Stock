/** Definición de cada paso del flujo de uso. */
interface Step {
  n: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    n: 1,
    title: "Practica gratis",
    description:
      "Inicia con $100,000 MXN ficticios en paper trading. Equivócate, aprende, descubre qué estrategias te resuenan.",
  },
  {
    n: 2,
    title: "Conoce tus métricas",
    description:
      "Cada gráfica e indicador viene con tooltip explicando qué significa. RSI, P/E, MACD, dividend yield — sin jerga.",
  },
  {
    n: 3,
    title: "Opera con confianza",
    description:
      "Cuando estés listo, registra tus trades reales de GBM+ y deja que el sistema calcule tu desempeño real.",
  },
];

/**
 * Sección "Cómo funciona" con 3 pasos numerados.
 */
export function HowItWorks() {
  return (
    <section className="bg-muted/30 mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">Cómo funciona</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="space-y-3">
              <div className="bg-primary text-primary-foreground inline-flex h-9 w-9 items-center justify-center rounded-full font-mono font-semibold">
                {s.n}
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
