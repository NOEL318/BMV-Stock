import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";
import tsdocPlugin from "eslint-plugin-tsdoc";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reporte de cobertura generado por vitest --coverage
    "coverage/**",
  ]),
  {
    // tsdoc plugin is not bundled by next, register it separately
    plugins: {
      tsdoc: tsdocPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
    rules: {
      "tsdoc/syntax": "warn",
      // import/order uses the already-registered import plugin from nextVitals
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/domain",
              from: "./src",
              except: ["./domain"],
              message: "domain layer must not depend on application, infrastructure, or app layers",
            },
            {
              target: "./src/application",
              from: "./src/infrastructure",
              message: "application layer must depend only on domain (via ports)",
            },
            {
              target: "./src/application",
              from: "./src/app",
              message: "application layer must not depend on the app/presentation layer",
            },
            {
              target: "./src/application",
              from: "./src/components",
              message: "application layer must not depend on UI components",
            },
            {
              target: "./src/app",
              from: "./src/infrastructure",
              except: ["./auth/clerk.ts", "./db/client.ts"],
              message:
                "presentation layer should call use cases in application/, not infrastructure directly",
            },
          ],
        },
      ],
      "import/no-default-export": "off",
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  // Must be last to disable formatting rules that conflict with prettier
  prettierConfig,
]);

export default eslintConfig;
