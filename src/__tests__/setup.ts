import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React 19 + Vitest: asegurar que react-dom reconozca el entorno de pruebas
// para que act() funcione correctamente con hooks.
// Ver: https://react.dev/link/act-warning
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom no implementa ResizeObserver, que sí existe en todos los navegadores
// modernos y que usa PriceChart para reaccionar a cambios de tamaño del
// contenedor. Lo mockeamos como no-op para que los componentes monten en tests.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

afterEach(() => {
  cleanup();
});
