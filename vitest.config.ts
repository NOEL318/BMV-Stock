import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Plugin que elimina la directiva "use client" de los archivos durante los tests.
 * En el entorno de Vitest (jsdom), la directiva no tiene sentido y puede causar
 * que los modulos de Next.js se resuelvan de forma diferente, ignorando aliases.
 */
function stripUseClientPlugin() {
  return {
    name: "strip-use-client",
    transform(code: string, id: string) {
      if (id.endsWith(".tsx") || id.endsWith(".ts")) {
        return code.replace(/^"use client";\n?/m, "").replace(/^'use client';\n?/m, "");
      }
    },
  };
}

export default defineConfig({
  plugins: [stripUseClientPlugin(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    environmentOptions: {
      jsdom: {
        // IS_REACT_ACT_ENVIRONMENT hace que react-dom use el actQueue sincrónico
        // en lugar del scheduler asincrónico, lo cual es necesario para que los
        // hooks funcionen correctamente en el entorno de tests.
        globals: {
          IS_REACT_ACT_ENVIRONMENT: true,
        },
      },
    },
    // vmThreads usa el modulo VM de Node para aislar los modulos del test,
    // lo que garantiza que react y react-dom compartan la misma instancia de
    // ReactSharedInternals (el dispatcher de hooks).
    pool: "vmThreads",
    // Fuerza que react y react-dom se procesen a traves del bundler de Vitest
    // en lugar de resolverse como modulos Node nativos. Esto garantiza que
    // ambos compartan la misma instancia de ReactSharedInternals (el dispatcher
    // de hooks), evitando el error "Cannot read properties of null (reading 'useState')".
    server: {
      deps: {
        inline: [/react/],
      },
    },
    coverage: {
      provider: "v8",
      include: ["src/domain/**", "src/application/**"],
      // di.ts es el composition root y no es testeable en modo unitario
      // (requiere conexión real a Neon/DB). Se excluye del reporte de cobertura.
      exclude: ["src/application/di.ts"],
      thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // En el entorno de tests, next/link no puede usarse sin RouterContext.
      // Se reemplaza con un stub de anchor nativo definido en __mocks__.
      "next/link": path.resolve(__dirname, "__mocks__/next/link.tsx"),
    },
    // Evita multiples copias de React en el bundle de tests.
    dedupe: ["react", "react-dom"],
  },
});
