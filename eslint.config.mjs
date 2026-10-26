import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    plugins: nextVitals[0].plugins,
    rules: {
      // Existing client-side data loaders intentionally populate state after mount.
      // Keep the new React Hooks rule visible without blocking the Next 16 migration.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    ".local-research/**",
    "out/**",
    "build/**",
    "cloudflare-env.d.ts",
    "next-env.d.ts",
  ]),
]);
