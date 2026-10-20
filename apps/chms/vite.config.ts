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
    // voidPlugin snapshots process.cwd() as its codegen root, so the root
    // Vitest run would emit a stray root .void/. Tests alias void/db instead.
    ...(process.env.VITEST ? [] : [voidPlugin()]),
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
    // Mirrors what voidPlugin provides in dev/build, which does not run under
    // Vitest: the SQLite stand-in for void/db and the schema barrel for @schema.
    alias: [
      {
        find: "@schema",
        replacement: path.resolve(import.meta.dirname, "./db/schema.ts"),
      },
      {
        find: "void/db",
        replacement: path.resolve(import.meta.dirname, "./test/void-db.ts"),
      },
    ],
    server: { deps: workspaceDeps },
  },
});
