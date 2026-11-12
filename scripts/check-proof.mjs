#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const testFile = /(?:\.test|\.spec)\.[cm]?[jt]sx?$/u;

const oneWay = [
  /^apps\/chms\/src\/db\/migrations\//u,
  /^apps\/chms\/src\/db\/schema\//u,
  /^apps\/chms\/src\/db\/seed/u,
  /^apps\/chms\/server\/auth/u,
  /^wrangler\./u,
  /^\.github\/workflows\//u,
];

const placeholder = /paste the relevant command output here/iu;
const picture = /!\[[^\]]*\]\(|playwright-report|trace\.zip|\.webm\b/u;

/** The lines under a `## heading`, up to the next level-one or level-two heading. */
const section = (body, heading) => {
  const lines = body.split("\n");
  const wanted = `## ${heading}`.toLowerCase();
  const start = lines.findIndex((line) => line.trim().toLowerCase() === wanted);
  if (start === -1) {
    return null;
  }

  const content = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,2}\s/u.test(line)) {
      break;
    }
    content.push(line);
  }
  return content;
};

/** The lines a person actually wrote: no blanks, no template comments, no "None." */
const written = (lines) =>
  (lines ?? [])
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("<!--") && !line.endsWith("-->"))
    .filter((line) => !/^(?:-?\s*)?none\.?$/iu.test(line));

/**
 * The part of the proof a script can check. It catches an empty or
 * unanswered body, not a false claim. A person reads the answer.
 */
export const checkProof = ({ body, files }) => {
  const findings = [];

  if (body.trim().length === 0) {
    return [
      "the pull request has no body. Use the template, including Proof and One-way doors.",
    ];
  }

  for (const line of body.split("\n")) {
    if (/^\s*[-*]\s*\[ \]/u.test(line)) {
      findings.push(`an unticked box: ${line.trim()}`);
    }
  }

  if (placeholder.test(body)) {
    findings.push(
      "the Proof block is still the template text. Paste the command output, or say what you ran."
    );
  }

  const changedTests = files.filter((name) => testFile.test(name));
  if (changedTests.length > 0) {
    const named = [...body.matchAll(/`(?<name>[^`\n]+)`/gu)]
      .map((match) => match.groups?.name ?? "")
      .filter((name) => testFile.test(name));
    const namesOne = named.some((name) =>
      changedTests.some((file) => file.endsWith(name) || name.endsWith(file))
    );
    if (!namesOne) {
      findings.push(
        "Proof names no changed test. Name the file and the case that fails when this breaks."
      );
    }
  }

  const touchesUi = files.some(
    (name) =>
      name.startsWith("apps/chms/src/") && /\.[jt]sx$|\.css$/u.test(name)
  );
  if (touchesUi && !picture.test(body)) {
    findings.push(
      "the diff changes a page or a component, and Proof has no screenshot, recording, or Playwright trace."
    );
  }

  const touchesDb = files.some((name) =>
    /^apps\/chms\/src\/db\/(?:schema|migrations)\//u.test(name)
  );
  if (touchesDb && !/db:drift/u.test(body)) {
    findings.push(
      "the diff changes the schema or a migration. Proof must show the `db:drift` output."
    );
  }

  if (files.some((name) => oneWay.some((pattern) => pattern.test(name)))) {
    const doors = section(body, "One-way doors");
    if (doors === null) {
      findings.push(
        "the diff touches a one-way door, and the body has no `## One-way doors` section."
      );
    } else if (written(doors).length === 0) {
      findings.push(
        "the diff touches a one-way door, and `## One-way doors` still says None. Name it for the person who merges."
      );
    }
  }

  return findings;
};

const run = (args) =>
  execFileSync("git", args, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const resolveBase = () => {
  const candidates = [
    process.env.BASE_REF,
    "origin/main",
    "origin/HEAD",
    "main",
  ];
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    try {
      run(["rev-parse", "--verify", candidate]);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
};

/** The PR body from the event on CI, or from gh on a workstation. */
const pullRequest = () => {
  if (process.env.PR_NUMBER) {
    return { present: true, body: process.env.PR_BODY ?? "" };
  }
  if (process.env.GITHUB_ACTIONS === "true") {
    return { present: false, body: "" };
  }
  try {
    const raw = execFileSync("gh", ["pr", "view", "--json", "body"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { present: true, body: JSON.parse(raw).body ?? "" };
  } catch {
    return { present: false, body: "" };
  }
};

const main = () => {
  const base = resolveBase();
  if (!base) {
    console.error(
      "Cannot resolve a base ref. Fetch it, or pass BASE_REF with the branch to compare against."
    );
    process.exit(1);
  }

  const { present, body } = pullRequest();
  if (!present) {
    console.log(
      "No pull request yet. The proof check runs on the pull request."
    );
    return;
  }

  const files = run(["diff", "--name-only", `${base}...HEAD`])
    .split("\n")
    .filter(Boolean);
  const findings = checkProof({ body, files });

  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(`pull request  ${finding}`);
    }
    process.exit(1);
  }

  console.log(`Proof answered (base ${base}, ${files.length} files).`);
};

if (process.argv[1] === import.meta.filename) {
  main();
}
