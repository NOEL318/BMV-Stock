import {
  LuChartCandlestick,
  LuCircleDollarSign,
  LuGraduationCap,
  LuListChecks,
  LuStar,
  LuTrendingUp,
} from "react-icons/lu";

import { Card, CardContent } from "@/components/ui/card";

/** Definición de cada feature para el grid. */
interface Feature {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: LuChartCandlestick,
    title: "Análisis con gráficas",
    description:
      "Velas, indicadores técnicos (RSI, MACD, medias móviles) y fundamentales con tooltips educativos.",
  },
  {
    icon: LuListChecks,
    title: "Paper trading",
    description: "Practica con $100,000 MXN ficticios antes de arriesgar capital real.",
  },
  {
    icon: LuCircleDollarSign,
    title: "Gestión de portafolio",
    description: "Registra tus trades de GBM+ y mide el desempeño contra el IPC.",
  },
  {
    icon: LuStar,
    title: "Watchlist",
    description: "Sigue las emisoras que te interesan con cotizaciones en casi tiempo real.",
  },
  {
    icon: LuTrendingUp,
    title: "Núcleo / satélite",
    description: "Calculadora de asignación base en ETFs según tu perfil de riesgo.",
  },
  {
    icon: LuGraduationCap,
    title: "Aprende invirtiendo",
    description: "Cada métrica viene con su explicación. Entiende lo que estás viendo.",
  },
];

/**
 * Grid de 6 features principales de la app.
 */
export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
        Lo que vas a tener
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title}>
              <CardContent className="space-y-2 pt-6">
                <Icon className="text-primary h-6 w-6" aria-hidden />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
