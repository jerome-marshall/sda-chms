import { defineConfig } from "void/config";

export default defineConfig({
  sourceDir: "src",
  head: {
    title: "sda-chms",
    link: [{ rel: "icon", href: "data:," }],
  },
  routing: {
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
