import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

import { assertSeedableHost } from "../server/lib/seed-guard";

/**
 * The only supported way to seed: refuses non-local databases BEFORE Void
 * connects (`void db seed` wipes `public` first, so nothing later can
 * prevent that), then delegates to it. Run via `pnpm db:seed`.
 */
const appDir = fileURLToPath(new URL("..", import.meta.url));

const readDatabaseUrl = (): string | undefined => {
  try {
    const parsed = dotenv.parse(readFileSync(`${appDir}/.env`, "utf-8"));
    return typeof parsed.DATABASE_URL === "string" && parsed.DATABASE_URL !== ""
      ? parsed.DATABASE_URL
      : undefined;
  } catch {
    return undefined;
  }
};

const databaseUrl = readDatabaseUrl();
if (databaseUrl === undefined) {
  throw new Error(
    `seed: cannot read DATABASE_URL from ${appDir}/.env. Create it first — see apps/web/ENV.md.`
  );
}

let hostname: unknown;
try {
  hostname = new URL(databaseUrl).hostname;
} catch {
  hostname = undefined;
}
assertSeedableHost(hostname);

execFileSync(
  fileURLToPath(new URL("../node_modules/.bin/void", import.meta.url)),
  ["db", "seed", "--yes"],
  { stdio: "inherit", cwd: appDir }
);
