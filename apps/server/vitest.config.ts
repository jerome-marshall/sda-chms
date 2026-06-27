import { defineConfig } from "vitest/config";
import { testInclude, workspaceDeps } from "../../vitest.shared";

export default defineConfig({
  test: {
    name: "server",
    environment: "node",
    include: testInclude,
    // Importing the Hono app validates @sda-chms/env at load; integration tests
    // never connect to this URL (PGlite is injected via setTestDb) but the env
    // schema must be satisfied.
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      CORS_ORIGIN: "http://localhost:3001",
      NODE_ENV: "test",
    },
    server: { deps: workspaceDeps },
  },
});
