"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider, type ResolvedTheme, type Theme } from "@/contexts/ThemeContext";

/**
 * Props del root `Providers`.
 * Los valores `initial*` los provee el root layout leyendo cookies en el server.
 * Esto permite aplicar la clase de tema a `<html>` durante SSR sin flicker.
 */
export interface ProvidersProps {
  children: React.ReactNode;
  initialThemePreference: Theme;
  initialResolvedTheme: ResolvedTheme;
}

/**
 * Providers globales de la app:
 * - `ClerkProvider`: identidad y sesión.
 * - `ThemeProvider`: light/dark via cookies + clase en `<html>`.
 * - `QueryClientProvider`: cache y sincronización de datos del servidor.
 * - `Toaster`: notificaciones de Sonner (componente de shadcn).
 */
export function Providers({
  children,
  initialThemePreference,
  initialResolvedTheme,
}: ProvidersProps) {
  // useState garantiza que el QueryClient sea estable a través de re-renders
  // y evita compartir cache entre usuarios en SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 20s de stale: re-fetch agresivo para datos de mercado en vivo.
            staleTime: 20_000,
            // Refrescar al regresar a la pestaña (común al ver mercado).
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ClerkProvider>
      <ThemeProvider
        initialPreference={initialThemePreference}
        initialResolved={initialResolvedTheme}
      >
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster richColors closeButton />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
