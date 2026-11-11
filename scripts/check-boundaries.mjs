#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const roots = ["apps/chms", "packages"];
const skipDirs = new Set([
  "node_modules",
  "dist",
  ".void",
  ".turbo",
  ".wrangler",
  ".vite",
  ".vite-hooks",
  "test-results",
  "playwright-report",
  "coverage",
]);
const extensions = [".ts", ".tsx"];

const rules = [
  {
    id: "run-promise-edge",
    message:
      "Run effects only in server/effect/runtime.ts. Tests and scripts may run them directly.",
    appliesTo: () => true,
    allow: (file) =>
      file === "apps/chms/server/effect/runtime.ts" ||
      file.startsWith("apps/chms/test/") ||
      file.startsWith("apps/chms/scripts/") ||
      file.startsWith("packages/"),
    test: /\bEffect\.(?:runPromise|runSync)\s*\(/u,
  },
  {
    id: "ambient-db",
    message:
      "Take `db: Database` as a parameter. getDb() belongs to server/db.ts and the Db layer.",
    appliesTo: (file) => file.startsWith("apps/chms/server/"),
    allow: (file) =>
      file === "apps/chms/server/db.ts" ||
      file === "apps/chms/server/effect/db.ts" ||
      file === "apps/chms/server/lib/seed-guard.ts" ||
      file.startsWith("apps/chms/test/") ||
      file.startsWith("apps/chms/scripts/"),
    test: /\bgetDb\s*\(/u,
  },
  {
    id: "db-import",
    message:
      "Import the database binding only in server/db.ts. Query helpers such as `eq` are fine.",
    appliesTo: () => true,
    allow: (file) =>
      file === "apps/chms/server/db.ts" || file === "apps/chms/test/void-db.ts",
    test: /import\s*\{[^}]*\bdb\b[^}]*\}\s*from\s*["']void\/db["']|import\s+db\s+from\s*["']void\/db["']/u,
  },
  {
    id: "try-catch-in-service",
    message: "Use fromDb, Effect.try, or Effect.fail in a service.",
    appliesTo: (file) => file.startsWith("apps/chms/server/effect/"),
    allow: () => false,
    test: /(?<![.\w])catch\s*\(|\btry\s*\{/u,
  },
  {
    id: "any-type",
    message: "Use `unknown` and a type guard.",
    appliesTo: () => true,
    allow: (file) =>
      file.endsWith(".d.ts") || file.startsWith("apps/chms/test/"),
    test: /(?::\s*any\b|\bas\s+any\b|<any>)/u,
  },
  {
    id: "error-channel",
    message: "Name the failure type in the error channel.",
    appliesTo: (file) => file.startsWith("apps/chms/server/effect/"),
    allow: (file) => file === "apps/chms/server/effect/runtime.ts",
    test: /Effect<[^>]*,\s*(?:Error|unknown)\s*[,>]/u,
  },
  {
    id: "route-reaches-db",
    message:
      "A route calls one Effect program and runApi. It never touches the database.",
    appliesTo: (file) => file.startsWith("apps/chms/src/routes/"),
    allow: () => false,
    test: /from\s+["'][^"']*(?:void\/db|drizzle-orm|server\/db)["']/u,
  },
  {
    id: "env-in-domain",
    message: "Read the environment at an edge, not in domain code.",
    appliesTo: (file) =>
      file.startsWith("apps/chms/server/") ||
      file.startsWith("apps/chms/src/db/"),
    allow: (file) =>
      file === "apps/chms/server/lib/seed-guard.ts" ||
      file === "apps/chms/src/db/seed.ts",
    test: /\bprocess\.env\b/u,
  },
];

const walk = (dir, found = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || skipDirs.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, found);
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      found.push(full);
    }
  }
  return found;
};

const violations = [];

for (const base of roots) {
  for (const full of walk(path.join(root, base))) {
    const file = path.relative(root, full);
    if (file.endsWith(".d.ts")) {
      continue;
    }
    const lines = readFileSync(full, "utf-8").split("\n");
    for (const rule of rules) {
      if (!rule.appliesTo(file) || rule.allow(file)) {
        continue;
      }
      for (const [index, line] of lines.entries()) {
        const trimmed = line.trimStart();
        if (
          trimmed.startsWith("*") ||
          trimmed.startsWith("//") ||
          trimmed.startsWith("/*")
        ) {
          continue;
        }
        if (rule.test.test(line)) {
          violations.push({
            file,
            line: index + 1,
            rule: rule.id,
            message: rule.message,
          });
        }
      }
    }
  }
}

for (const violation of violations) {
  console.log(
    `${violation.file}:${violation.line}  ${violation.rule}  ${violation.message}`
  );
}

if (violations.length > 0) {
  console.error(`\n${violations.length} boundary violation(s).`);
  process.exit(1);
}

console.log("Boundaries clean.");
