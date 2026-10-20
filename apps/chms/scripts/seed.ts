import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * The only supported way to seed: delegates to Void, which resets the local
 * D1 database, runs migrations, and runs `db/seed.ts`. No connection string
 * and no host guard — the local D1 database is a file by construction, so
 * there is no remote to protect against. Run via `pnpm db:seed`.
 */
const appDir = fileURLToPath(new URL("..", import.meta.url));

execFileSync(
  fileURLToPath(new URL("../node_modules/.bin/void", import.meta.url)),
  ["db", "seed", "--yes"],
  { stdio: "inherit", cwd: appDir }
);
