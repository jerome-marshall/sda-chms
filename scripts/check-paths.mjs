#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

const topLevel = [
  "apps",
  "packages",
  "docs",
  "scripts",
  "e2e",
  ".github",
  ".agents",
  ".claude",
];
const repoPath = new RegExp(
  String.raw`(?<![\w./-])(?:${topLevel.map((dir) => dir.replace(".", String.raw`\.`)).join("|")})/[\w.@[\]/-]*[\w\]/]`,
  "gu"
);
const markdownLink = /\]\((?<target>[^)\s#]+)(?:#[^)]*)?\)/gu;

const isPattern = (reference) =>
  /[*<>{}]|\.\.\.|\$/u.test(reference) || reference.includes("[...");

/** Every repo path one file names, with its line. Pure, so it can be tested. */
export const references = (file, text) => {
  const found = [];
  for (const [index, line] of text.split("\n").entries()) {
    for (const match of line.matchAll(repoPath)) {
      const after = line.slice((match.index ?? 0) + match[0].length);
      if (isPattern(after.slice(0, 3))) {
        continue;
      }
      found.push({ line: index + 1, reference: match[0], base: root });
    }
    if (file.endsWith(".md")) {
      for (const match of line.matchAll(markdownLink)) {
        const target = match.groups?.target ?? "";
        if (/^[a-z]+:/iu.test(target) || target.startsWith("/")) {
          continue;
        }
        found.push({
          line: index + 1,
          reference: target,
          base: path.join(root, path.dirname(file)),
        });
      }
    }
  }
  return found.filter((item) => !isPattern(item.reference));
};

const isIgnored = (absolute) => {
  try {
    execFileSync("git", ["check-ignore", absolute, `${absolute}/`], {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * The references in one file that point at nothing. A gitignored path such as
 * `apps/chms/.env` is a local file the reader creates, so it counts as present.
 */
export const missing = (
  file,
  text,
  { exists = existsSync, ignored = isIgnored } = {}
) =>
  references(file, text).filter((item) => {
    const absolute = path.resolve(item.base, item.reference);
    return !exists(absolute) && !ignored(absolute);
  });

/**
 * Instructions and gate config. ADRs and research notes are dated records, so
 * a path they name may be gone on purpose.
 */
const scanned = () =>
  execFileSync(
    "git",
    [
      "ls-files",
      "--",
      "*.md",
      "vite.config.ts",
      "apps/*/vite.config.ts",
      "package.json",
      "apps/*/package.json",
      "packages/*/package.json",
      ".github/workflows/*.yml",
      ":!docs/adr",
      ":!docs/research",
    ],
    { cwd: root, encoding: "utf-8" }
  )
    .split("\n")
    .filter(Boolean);

const main = () => {
  const files = scanned();
  const findings = files.flatMap((file) =>
    missing(file, readFileSync(path.join(root, file), "utf-8")).map(
      (item) =>
        `${file}:${item.line}  names \`${item.reference}\`, which does not exist. Point it at the real path or delete the reference.`
    )
  );

  for (const finding of findings) {
    console.error(finding);
  }
  if (findings.length > 0) {
    process.exit(1);
  }
  console.log(`Path references clean (${files.length} files).`);
};

if (process.argv[1] === import.meta.filename) {
  main();
}
