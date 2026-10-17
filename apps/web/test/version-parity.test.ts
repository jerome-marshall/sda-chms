import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

/**
 * `drizzle-orm` and `hono` are pinned in the pnpm catalog to the exact versions
 * Void bundles, so the app shares Void's single installed copy — two copies
 * produce incompatible Drizzle `Column` types across `void/schema-pg` and
 * `relations`. This test fails when Void upgrades past the pin (or pnpm stops
 * deduping), naming the constraint instead of surfacing as a type error.
 */
describe("version parity with Void's bundled dependencies", () => {
  const require = createRequire(import.meta.url);
  const voidDir = path.join(
    path.dirname(require.resolve("void/handler")),
    "..",
    ".."
  );

  it.each(["drizzle-orm", "hono"])(
    "resolves %s to the same file Void resolves",
    (name) => {
      const appCopy = realpathSync(require.resolve(name));
      const voidCopy = realpathSync(
        require.resolve(name, { paths: [voidDir] })
      );
      expect(appCopy).toBe(voidCopy);
    }
  );
});
