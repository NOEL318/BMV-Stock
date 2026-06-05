import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Rutas publicas que no requieren autenticacion de Clerk.
 * Cualquier ruta no listada aqui queda protegida por Clerk.
 *
 * `/api/cron(.*)` queda fuera de Clerk porque lo invoca el cron de Vercel sin
 * sesion de usuario; ese endpoint se autentica por su cuenta via `CRON_SECRET`.
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
