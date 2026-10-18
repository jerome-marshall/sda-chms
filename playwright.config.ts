import { defineConfig, devices } from "@playwright/test";

const PORT = 3001;
const baseURL = `http://localhost:${PORT}`;

/**
 * Local throwaway Postgres for E2E. CI sets DATABASE_URL to the service
 * container; locally this default is used. The webServer command writes it
 * into apps/web/.env first (Void reads only that file and rejects
 * .env.example), then migrates, seeds, and serves.
 */
const E2E_DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:password@localhost:5432/sda_chms";

/**
 * E2E runs against one Void server (API + SPA on a single origin) backed by
 * a throwaway Postgres. Locally the dev server serves for fast iteration;
 * in CI the production build is served through the built worker so E2E
 * exercises the real artifact (see the commit trail for the local
 * production proof). Either way the database is migrated and seeded first.
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
      ? 'printf \'DATABASE_URL=%s\\n\' "$DATABASE_URL" > .env && pnpm exec void db migrate && pnpm run db:seed && pnpm run build && pnpm exec wrangler dev --config dist/ssr/wrangler.json --port 3001 --var "DATABASE_URL:$DATABASE_URL"'
      : "printf 'DATABASE_URL=%s\\n' \"$DATABASE_URL\" > .env && pnpm exec void db migrate && pnpm run db:seed && pnpm run dev",
    cwd: "apps/web",
    url: baseURL,
    env: { DATABASE_URL: E2E_DATABASE_URL, SEED_COUNT: "20" },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
