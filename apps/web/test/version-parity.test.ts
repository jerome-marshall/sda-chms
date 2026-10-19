import { readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

/**
 * `drizzle-orm` and `hono` are pinned in the pnpm catalog to the exact versions
 * Void bundles, and the workspace overrides force every graph edge onto those
 * pins, so the app and Void share one installed copy. Two copies produce
 * incompatible Drizzle `Column` types across `void/schema-pg` and `relations`.
 * The same-file assertion also catches pnpm installing one version twice under
 * different peer sets, which the override alone cannot prevent. When Void
 * moves past a pin, the range assertion fails; bump the catalog pin (and with
 * it the override) in pnpm-workspace.yaml rather than chasing type errors.
 */
describe("version parity with Void's bundled dependencies", () => {
  const require = createRequire(import.meta.url);
  const voidDir = path.join(
    path.dirname(require.resolve("void/handler")),
    "..",
    ".."
  );
  const voidPkg = JSON.parse(
    readFileSync(path.join(voidDir, "package.json"), "utf-8")
  ) as { dependencies: Record<string, string> };

  it.each(["drizzle-orm", "hono"])(
    "resolves %s to the same file Void resolves",
    (name) => {
      const appCopy = realpathSync(require.resolve(name));
      const voidCopy = realpathSync(
        require.resolve(name, { paths: [voidDir] })
      );
      expect(
        appCopy,
        `${name}: the app and Void resolved different installed copies; align the catalog pin and override in pnpm-workspace.yaml with Void's version`
      ).toBe(voidCopy);
    }
  );

  it.each(["drizzle-orm", "hono"])(
    "installed %s satisfies Void's declared dependency range",
    (name) => {
      const range = voidPkg.dependencies[name];
      if (typeof range !== "string") {
        throw new TypeError(`test: void does not depend on ${name}`);
      }
      const installed = packageVersion(realpathSync(require.resolve(name)));
      expect(
        satisfies(installed, range),
        `${name}@${installed} does not satisfy void's ${range}; bump the catalog pin in pnpm-workspace.yaml to a version Void accepts`
      ).toBe(true);
    }
  );
});

/** Walks up from a resolved entry file to its package.json. */
const packageVersion = (entryFile: string): string => {
  let dir = path.dirname(entryFile);
  for (let depth = 0; depth < 8; depth += 1) {
    try {
      const pkg = JSON.parse(
        readFileSync(path.join(dir, "package.json"), "utf-8")
      ) as { name?: string; version?: string };
      if (typeof pkg.version === "string") {
        return pkg.version;
      }
    } catch {
      // Missing or unparseable — keep walking up.
    }
    dir = path.dirname(dir);
  }
  throw new Error(`test: cannot find package.json above ${entryFile}`);
};

/** Minimal caret/exact range check — the catalog pins exact, Void declares ^. */
const satisfies = (version: string, range: string): boolean => {
  if (range === version) {
    return true;
  }
  if (range.startsWith("^")) {
    const [rangeMajor, ...rangeRest] = range.slice(1).split(".").map(Number);
    const [versionMajor, ...versionRest] = version.split(".").map(Number);
    if (rangeMajor !== versionMajor) {
      return false;
    }
    for (const [index, rangePart] of rangeRest.entries()) {
      const versionPart = versionRest[index] ?? 0;
      if (versionPart !== rangePart) {
        return versionPart > rangePart;
      }
    }
    return true;
  }
  return false;
};
