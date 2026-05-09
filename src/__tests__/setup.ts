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

afterEach(() => {
  cleanup();
});
