import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { testInclude, workspaceDeps } from "../../vitest.shared";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    name: "web",
    environment: "jsdom",
    include: testInclude,
    setupFiles: ["./vitest.setup.ts"],
    env: {
      VITE_SERVER_URL: "http://localhost:3000",
    },
    server: { deps: workspaceDeps },
  },
});
