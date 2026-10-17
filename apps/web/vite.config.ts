import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";
import { voidPlugin } from "void";

import { testInclude, workspaceDeps } from "../../vitest.shared";

export default defineConfig({
  plugins: lazyPlugins(() => [
    tailwindcss(),
    tanstackRouter({}),
    react(),
    voidPlugin(),
  ]),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  // strictPort so a busy port fails loudly instead of silently shifting to 3002
  // (which would leave the Playwright webServer probing :3001 until it times out).
  server: {
    port: 3001,
    strictPort: true,
    allowedHosts: ["machine0.fennec-mark.ts.net"],
  },
  preview: {
    port: 3001,
    strictPort: true,
  },
  test: {
    name: "web",
    environment: "node",
    include: [...testInclude, "test/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    env: {
      VITE_SERVER_URL: "http://localhost:3000",
      // Route tests mount the real handlers, which still read the server env
      // through @sda-chms/server until the server code moves into apps/web.
      // PGlite is injected via setTestDb, so these never open a connection.
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      CORS_ORIGIN: "http://localhost:3001",
      NODE_ENV: "test",
    },
    // Mirrors what voidPlugin provides in dev/build, which does not run under
    // Vitest: the PGlite stand-in for void/db and the schema barrel for @schema.
    alias: {
      "void/db": path.resolve(import.meta.dirname, "./test/void-db.ts"),
      "@schema": path.resolve(import.meta.dirname, "./db/schema.ts"),
    },
    server: { deps: workspaceDeps },
  },
});
