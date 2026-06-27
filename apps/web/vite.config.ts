import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), tanstackRouter({}), react()],
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
  },
  preview: {
    port: 3001,
    strictPort: true,
  },
});
