import { defineConfig } from "vitest/config";

/**
 * Root config aggregates every package's Vitest config as a project, so a single
 * `vitest` (watch) run at the repo root covers all packages — this powers /tdd.
 * CI and `bun run test` instead fan out per package via `turbo test`, where each
 * package runs its own config.
 */
export default defineConfig({
  test: {
    projects: [
      "packages/shared/vitest.config.ts",
      "packages/db/vitest.config.ts",
      "apps/server/vitest.config.ts",
      "apps/web/vitest.config.ts",
    ],
  },
});
