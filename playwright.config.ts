import { defineConfig, devices } from "@playwright/test";

const PORT = 3001;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E runs against one Void server (API + SPA on a single origin) backed by
 * local D1. No database service and no connection string: `void db migrate`
 * provisions the local file under apps/chms/.void/, then the database is
 * seeded and served. Locally the dev server serves for fast iteration; in CI
 * the production build is served through the built worker so E2E exercises
 * the real artifact. (The Wrangler webServer path moves to the Void preview
 * path in a later PR.)
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI
      ? "pnpm exec void db migrate && pnpm run db:seed && pnpm run build && pnpm exec wrangler dev --config dist/ssr/wrangler.json --port 3001"
      : "pnpm exec void db migrate && pnpm run db:seed && pnpm run dev",
    cwd: "apps/chms",
    url: baseURL,
    env: { SEED_COUNT: "20" },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
