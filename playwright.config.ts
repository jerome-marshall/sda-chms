import { defineConfig, devices } from "@playwright/test";

const PORT = 3001;
const baseURL = `http://localhost:${PORT}`;

/**
 * Local throwaway Postgres for E2E. The server's own `.env` resolves
 * `DATABASE_URL` to a cloud DB, so we override it here to guarantee a local
 * `test:e2e` never reads or seeds production. In CI, `DATABASE_URL` is already
 * set to the service container, so we defer to it.
 */
const E2E_DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:password@localhost:5432/sda_chms";

/**
 * E2E runs against the real stack — web (3001) + Bun/Hono server (3000) + a
 * throwaway Postgres (the server is node-postgres). Locally: `bun run db:start`,
 * apply the schema + seed, then `bun run test:e2e`. In CI a Postgres service
 * container is provisioned, schema-applied, and seeded (see .github/workflows/test.yml).
 *
 * The two servers are started and health-gated independently so the API (3000)
 * is ready before tests run, not just the web tier (3001). In CI the web app is
 * served from a production build (`vite preview`) so E2E exercises the real
 * artifact; locally it uses the dev server for fast iteration.
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
  webServer: [
    {
      command: "bun run dev",
      cwd: "apps/server",
      url: "http://localhost:3000/",
      // Override the server's cloud DATABASE_URL so local E2E targets a
      // throwaway Postgres (Playwright merges this over process.env).
      env: { DATABASE_URL: E2E_DATABASE_URL },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: process.env.CI
        ? "bun run build && bun run serve"
        : "bun run dev",
      cwd: "apps/web",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
