/**
 * Layout para rutas publicas (sin auth requerida).
 * Por ahora solo envuelve el contenido; en planes futuros puede agregar
 * un footer publico con disclaimer.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-background min-h-screen">{children}</div>;
}
