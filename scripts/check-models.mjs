#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const tlcVersion = "1.7.4";
const tlcSha256 =
  "936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88";
const tlcUrl = `https://github.com/tlaplus/tlaplus/releases/download/v${tlcVersion}/tla2tools.jar`;

/**
 * Each config and what TLC must say about it. A config that replays a past
 * bug must keep failing, or the model has stopped describing the code.
 */
export const checks = [
  {
    spec: "models/household-head/HouseholdHead.tla",
    config: "models/household-head/HouseholdHead.cfg",
    expect: "pass",
  },
  {
    spec: "models/household-head/HouseholdHead.tla",
    config: "models/household-head/WithoutIndex.cfg",
    expect: "Invariant AtMostOneHead is violated",
  },
];

const passed = "Model checking completed. No error has been found.";

/** Whether one TLC run met its expectation. Pure, so it can be tested. */
export const verdict = (check, output) => {
  if (check.expect === "pass") {
    return output.includes(passed)
      ? null
      : `${check.config} must pass, and TLC found an error.`;
  }
  return output.includes(check.expect)
    ? null
    : `${check.config} must report "${check.expect}". The model no longer catches the bug it replays.`;
};

const jarPath = () => {
  if (process.env.TLA2TOOLS) {
    return process.env.TLA2TOOLS;
  }
  const cached = path.join(
    root,
    "node_modules/.cache/tla2tools",
    tlcVersion,
    "tla2tools.jar"
  );
  if (!existsSync(cached)) {
    mkdirSync(path.dirname(cached), { recursive: true });
    execFileSync("curl", ["-fsSL", "-o", cached, tlcUrl]);
  }
  const digest = createHash("sha256")
    .update(readFileSync(cached))
    .digest("hex");
  if (digest !== tlcSha256) {
    writeFileSync(cached, "");
    throw new Error(`tla2tools.jar checksum mismatch: ${digest}`);
  }
  return cached;
};

const javaPath = () => {
  const java = process.env.JAVA ?? "java";
  const probe = spawnSync(java, ["-version"], { encoding: "utf-8" });
  if (probe.status !== 0) {
    console.error(
      "TLC needs Java 11 or later. Install one (`mise install java@temurin-25`) and put it on PATH, or set JAVA to its binary."
    );
    process.exit(1);
  }
  return java;
};

const main = () => {
  const java = javaPath();
  const jar = jarPath();
  const failures = [];
  const metadir = mkdtempSync(path.join(tmpdir(), "tlc-"));
  for (const check of checks) {
    const run = spawnSync(
      java,
      [
        "-XX:+UseParallelGC",
        "-cp",
        jar,
        "tlc2.TLC",
        "-workers",
        "auto",
        "-metadir",
        metadir,
        "-cleanup",
        "-config",
        path.basename(check.config),
        path.basename(check.spec),
      ],
      { cwd: path.join(root, path.dirname(check.spec)), encoding: "utf-8" }
    );
    const output = `${run.stdout}${run.stderr}`;
    const failure = verdict(check, output);
    if (failure) {
      failures.push(failure);
      console.error(output);
    } else {
      console.log(
        `${check.config}  ${check.expect === "pass" ? "holds" : check.expect}`
      );
    }
  }
  rmSync(metadir, { recursive: true, force: true });
  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure);
    }
    process.exit(1);
  }
};

if (process.argv[1] === import.meta.filename) {
  main();
}
