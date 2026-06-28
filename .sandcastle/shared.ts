// Shared configuration + host-side git/gh helpers for the Sandcastle entry
// points (main.ts = plan→implement→review→open-PR; address-comments.ts =
// address PR review feedback). Keeping this in one place means the sandbox
// setup and the prod-DB guard never drift between the two flows.

import { execFileSync } from "node:child_process";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

// Branch that PRs target and the base for diffs.
export const BASE_BRANCH = "main";

// Local throwaway Postgres that lives INSIDE the sandbox (installed in the
// Dockerfile, started by the onSandboxReady hook below). Pinning DATABASE_URL
// to it is the load-bearing prod-DB guard: the sandbox never receives the
// production Neon URL (only .sandcastle/.env, which holds just the OAuth + GH
// tokens), so every command an agent runs — dev server, drizzle push, headless
// Playwright E2E — resolves to this local instance and can never reach prod.
// Vitest ignores it entirely (it injects PGlite via setTestDb).
const LOCAL_DB_URL = "postgresql://postgres:password@localhost:5432/sda_chms";

// Hooks run inside the sandbox before the agent starts each iteration:
//   1. bun install — fresh deps. This is a Bun workspace using the catalog:
//      protocol, which npm cannot parse, so npm install is wrong here.
//   2. start Postgres + ensure the E2E database exists, so headless Playwright
//      E2E is runnable without docker-compose (there is no docker-in-docker).
export const hooks = {
  sandbox: {
    onSandboxReady: [
      { command: "bun install", timeoutMs: 300_000 },
      // Start Postgres (needs root) and ensure the throwaway E2E database
      // exists. Trust auth on localhost (see Dockerfile) lets `createdb`
      // connect as the postgres role without a password; `|| true` makes it
      // idempotent if the container/database is reused.
      { command: "sudo service postgresql start" },
      {
        command:
          "PGPASSWORD=password createdb -h localhost -U postgres sda_chms </dev/null || true",
      },
    ],
  },
};

// NOTE: node_modules is intentionally NOT copied from the host. The host runs
// macOS (darwin-arm64) and the sandbox runs Linux, so copied platform-specific
// binaries would be invalid. `bun install` in the hook above builds a clean,
// Linux-correct tree inside the sandbox instead.
export const copyToWorktree: string[] = [];

// Sandbox factory: Docker, with DATABASE_URL pinned to the in-sandbox Postgres.
// Use this everywhere instead of bare docker() so the prod-DB guard is uniform.
export const sandboxProvider = () =>
  docker({ env: { DATABASE_URL: LOCAL_DB_URL } });

// ---------------------------------------------------------------------------
// Host-side git/gh helpers
//
// These run in the HOST repo (not the sandbox), which is already authenticated
// for both git (https) and gh. Sandcastle commits land on local branch refs in
// the shared .git (Docker uses a bind-mounted worktree), so after a sandbox
// closes we can push those branches and open PRs straight from the host.
// ---------------------------------------------------------------------------

function sh(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, { encoding: "utf8" }).trim();
}

/** Open PR number for a branch, or null if none is open. */
export function openPrNumber(branch: string): number | null {
  const out = sh("gh", [
    "pr",
    "list",
    "--head",
    branch,
    "--state",
    "open",
    "--json",
    "number",
    "--jq",
    ".[0].number // empty",
  ]);
  return out ? Number(out) : null;
}

/** The head branch name for a PR. */
export function prBranch(pr: number): string {
  return sh("gh", [
    "pr",
    "view",
    String(pr),
    "--json",
    "headRefName",
    "--jq",
    ".headRefName",
  ]);
}

/** Push a branch to origin. Branches only ever move forward here, so a plain
 *  fast-forward push is correct (the user adds PR comments, not commits). */
export function pushBranch(branch: string): void {
  sh("git", ["fetch", "origin"]);
  sh("git", ["push", "-u", "origin", branch]);
}

/** Last capture-group match of a global regex over text, or null. */
function lastMatch(text: string, re: RegExp): string | null {
  let last: string | null = null;
  for (const m of text.matchAll(re)) {
    last = m[1] ?? null;
  }
  return last;
}

/**
 * Parse a PR title + body from a describe agent's combined stdout. The agent is
 * told to emit <pr-title>…</pr-title> and <pr-body>…</pr-body>; we take the LAST
 * occurrence of each (the agent's final answer, past any reasoning/echoes).
 * Returns null if either tag is missing, so callers can fall back.
 */
export function parsePrDescription(
  raw: string
): { title: string; body: string } | null {
  const title = lastMatch(raw, /<pr-title>([\s\S]*?)<\/pr-title>/g)?.trim();
  const body = lastMatch(raw, /<pr-body>([\s\S]*?)<\/pr-body>/g)?.trim();
  if (!(title && body)) {
    return null;
  }
  return { title, body };
}

/** Open a PR for an already-pushed branch. Returns the PR URL. */
export function createPr(branch: string, title: string, body: string): string {
  return sh("gh", [
    "pr",
    "create",
    "--base",
    BASE_BRANCH,
    "--head",
    branch,
    "--title",
    title,
    "--body",
    body,
  ]);
}
