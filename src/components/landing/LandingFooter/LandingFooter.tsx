/**
 * Footer minimalista de la landing pública.
 * Recuerda al usuario que el sistema es educativo y no constituye asesoría financiera.
 */
export function LandingFooter() {
  return (
    <footer className="border-border border-t py-8">
      <div className="text-muted-foreground mx-auto max-w-4xl px-4 text-center text-xs">
        <p>BMV Stock · Herramienta personal de gestión y educación financiera.</p>
        <p className="mt-1">No es asesoría financiera. Datos de mercado pueden tener retraso.</p>
      </div>
    </footer>
  );
}
