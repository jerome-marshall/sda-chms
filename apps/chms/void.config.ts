import { defineConfig } from "void/config";

export default defineConfig({
  sourceDir: "src",
  // The SPA shell used to come from index.html; pages render their own
  // document, so the title and empty favicon live here now.
  head: {
    title: "sda-chms",
    link: [{ rel: "icon", href: "data:," }],
  },
  routing: {
    // Applied by Void's worker middleware, so page and `/api` responses get
    // the same headers in dev and in the production build.
    headers: {
      "/*": [
        "x-content-type-options: nosniff",
        "x-frame-options: DENY",
        "referrer-policy: strict-origin-when-cross-origin",
      ],
    },
  },
  worker: {
    compatibility_date: "2026-02-24",
  },
});
