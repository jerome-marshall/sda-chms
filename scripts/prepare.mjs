// Prepare hook: clear a stale core.hooksPath left by Husky, then install .vite-hooks.
//
// A hooksPath is stale when it names .husky (removed in the Vite+ migration)
// or when it points at a directory that no longer exists. Anything else is a
// deliberate user choice and is left alone (vp then skips, as before).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf-8" }).trim();
}

function staleHooksPath() {
  let shown;
  try {
    shown = git("config", "--show-origin", "core.hooksPath");
  } catch {
    return null;
  }
  const tab = shown.indexOf("\t");
  const origin = shown.slice("file:".length, tab);
  const value = shown.slice(tab + 1);
  if (value === ".husky" || value.startsWith(".husky/")) {
    return { origin, value };
  }
  const abs = path.isAbsolute(value)
    ? value
    : path.resolve(git("rev-parse", "--show-toplevel"), value);
  if (!existsSync(abs)) {
    return { origin, value };
  }
  return null;
}

const stale = staleHooksPath();
if (stale) {
  git("config", "--file", stale.origin, "--unset-all", "core.hooksPath");
  console.log(
    `prepare: removed stale core.hooksPath "${stale.value}" (${stale.origin})`
  );
}
execFileSync("vp", ["config", "--hooks-dir", ".vite-hooks"], {
  stdio: "inherit",
});
