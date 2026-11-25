import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appDir = fileURLToPath(new URL("..", import.meta.url));

execFileSync(
  fileURLToPath(new URL("../node_modules/.bin/void", import.meta.url)),
  ["db", "seed", "--yes"],
  { stdio: "inherit", cwd: appDir }
);
