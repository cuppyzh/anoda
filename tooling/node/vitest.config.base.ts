// Shared Vitest base for every *.ui.anoda.com app.
// A service's vitest.config.ts:
//   import { mergeConfig } from "vitest/config";
//   import base from "../../tooling/node/vitest.config.base";
//   export default mergeConfig(base, defineConfig({ /* app-specific */ }));
//
// Coverage thresholds mirror docs/contracts/04-testing.md. Do not lower without an ADR.
// Peer deps (dev): vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
//                  @testing-library/user-event vitest-axe msw @vitejs/plugin-react vite-tsconfig-paths
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: false, // import { describe, it, expect } explicitly
    allowOnly: false, // it.only / describe.only fail the run (04 §Universal rules)
    passWithNoTests: false,
    restoreMocks: true,
    clearMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    // Each service adds tests/setup.ts that registers jest-dom + vitest-axe matchers and MSW server.
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "out", "e2e/**"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      all: true,
      include: ["app/**", "features/**", "components/shared/**", "lib/**"],
      exclude: [
        // routing files are composition only (04 §Next.js) — behavior is tested via features
        "app/**/page.tsx",
        "app/**/layout.tsx",
        "app/**/loading.tsx",
        "app/**/error.tsx",
        "app/**/not-found.tsx",
        "app/**/template.tsx",
        // vendored shadcn copies, generated clients, test scaffolding, config
        "components/ui/**",
        "**/*.gen.ts",
        "**/gen/**",
        "tests/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/index.ts", // barrel files
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
        perFile: false,
        autoUpdate: false,
      },
    },
  },
});
