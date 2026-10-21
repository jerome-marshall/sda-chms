import { execFileSync } from "node:child_process";

execFileSync("vp", ["config", "--hooks-dir", ".vite-hooks"], {
  stdio: "inherit",
});
