import { defineConfig } from "vite-plus";

/**
 * Root config aggregates every package's Vitest config as a project, so a single
 * `vitest` (watch) run at the repo root covers all packages — this powers /tdd.
 * CI and `bun run test` instead fan out per package via `turbo test`, where each
 * package runs its own config.
 */
export default defineConfig({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    projects: [
      "packages/shared/vitest.config.ts",
      "packages/db/vitest.config.ts",
      "apps/server/vitest.config.ts",
      "apps/web/vitest.config.ts",
    ],
  },
});
