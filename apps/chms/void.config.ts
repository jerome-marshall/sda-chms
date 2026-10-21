import { defineConfig } from "void/config";

export default defineConfig({
  sourceDir: "src",
  // The SPA shell used to come from index.html; pages render their own
  // document, so the title and empty favicon live here now.
  head: {
    title: "sda-chms",
    link: [{ rel: "icon", href: "data:," }],
  },
  worker: {
    compatibility_date: "2026-02-24",
  },
});
