// Parallel Planner with Review — plan → implement → review → open PR
//
// This is a single pass (no auto-merge loop):
//   Phase 1 (Plan):             An opus agent reads the `ready-for-agent` issues,
//                               builds a dependency graph, and outputs a <plan>
//                               JSON listing unblocked issues + branch names.
//   Phase 2 (Execute + Review): For each issue, a sandbox is created. The
//                               implementer runs first (up to 100 iterations);
//                               if it produces commits, the reviewer runs in the
//                               same sandbox on the same branch. Issue pipelines
//                               run concurrently via Promise.allSettled().
//   Phase 3 (Publish):          For each branch with commits, push it to origin
//                               and open a PR against main. NOTHING is merged —
//                               you review and merge the PRs yourself.
//
// Because nothing is auto-merged, dependent issues stay blocked until you merge
// a PR (which closes its issue). Re-run after merging to pick up newly unblocked
// work. Issues that already have an open PR are skipped so work isn't duplicated.
//
// To address review comments you leave on a PR, run:
//   bun run sandcastle:pr-comments <PR_NUMBER> [<PR_NUMBER> ...]
//
// Usage:
//   bun run sandcastle

import { claudeCode, createSandbox, Output, run } from "@ai-hero/sandcastle";
import { z } from "zod";
import {
  copyToWorktree,
  createPr,
  hooks,
  openPrNumber,
  parsePrDescription,
  pushBranch,
  sandboxProvider,
} from "./shared";

// The planner emits its plan as JSON inside <plan> tags; Output.object extracts
// and validates it against this schema.
const planSchema = z.object({
  issues: z.array(
    z.object({ id: z.string(), title: z.string(), branch: z.string() })
  ),
});

// ---------------------------------------------------------------------------
// Phase 1: Plan
//
// The planning agent reads the `ready-for-agent` issue list, builds a dependency
// graph, and selects the issues that can be worked in parallel right now (no
// blocking dependencies on other open issues). It outputs a <plan> JSON block
// that Output.object parses and validates.
// ---------------------------------------------------------------------------
const plan = await run({
  hooks,
  sandbox: sandboxProvider(),
  name: "planner",
  // One iteration is enough: the planner just needs to read and reason, not
  // write code. (Structured output requires maxIterations: 1.)
  maxIterations: 1,
  // Planner: high effort — dependency analysis benefits from deeper reasoning.
  agent: claudeCode("claude-opus-4-8", { effort: "high" }),
  promptFile: "./.sandcastle/plan-prompt.md",
  output: Output.object({ tag: "plan", schema: planSchema }),
});

const planned = plan.output.issues;

if (planned.length === 0) {
  console.log("No unblocked issues to work on. Exiting.");
  process.exit(0);
}

// Skip issues that already have an open PR awaiting your review/merge — working
// them again would duplicate an in-flight branch. They become eligible again
// once you merge the PR (which closes the issue).
const issues = planned.filter((issue) => {
  const pr = openPrNumber(issue.branch);
  if (pr !== null) {
    console.log(
      `  Skipping issue ${issue.id}: PR #${pr} already open for ${issue.branch}`
    );
    return false;
  }
  return true;
});

if (issues.length === 0) {
  console.log("All planned issues already have open PRs. Nothing to do.");
  process.exit(0);
}

console.log(
  `Planning complete. ${issues.length} issue(s) to work in parallel:`
);
for (const issue of issues) {
  console.log(`  ${issue.id}: ${issue.title} → ${issue.branch}`);
}

// ---------------------------------------------------------------------------
// Phase 2: Execute + Review
//
// For each issue, create a sandbox via createSandbox() so the implementer and
// reviewer share the same sandbox/branch. The implementer runs first; if it
// produces commits, the reviewer runs in the same sandbox.
//
// Promise.allSettled means one failing pipeline doesn't cancel the others.
// ---------------------------------------------------------------------------
const settled = await Promise.allSettled(
  issues.map(async (issue) => {
    const sandbox = await createSandbox({
      branch: issue.branch,
      sandbox: sandboxProvider(),
      hooks,
      copyToWorktree,
    });

    try {
      const implement = await sandbox.run({
        name: "implementer",
        maxIterations: 100,
        // Implementer: medium effort — iterates across up to 100 loops per
        // issue, run in parallel. The reviewer (high) is the quality backstop.
        agent: claudeCode("claude-opus-4-8", { effort: "medium" }),
        promptFile: "./.sandcastle/implement-prompt.md",
        promptArgs: {
          TASK_ID: issue.id,
          ISSUE_TITLE: issue.title,
          BRANCH: issue.branch,
        },
      });

      // Nothing implemented → nothing to review, describe, or publish.
      if (implement.commits.length === 0) {
        return { commits: implement.commits, pr: null };
      }

      const review = await sandbox.run({
        name: "reviewer",
        maxIterations: 1,
        // Reviewer: high effort — the quality backstop that catches what the
        // medium-effort implementer missed.
        agent: claudeCode("claude-opus-4-8", { effort: "high" }),
        promptFile: "./.sandcastle/review-prompt.md",
        promptArgs: {
          BRANCH: issue.branch,
        },
      });

      // Each sandbox.run() only reports its own commits; combine them so we know
      // the branch produced work worth a PR.
      const commits = [...implement.commits, ...review.commits];

      // Describe: an agent writes the PR title + body from the actual diff,
      // emitted in <pr-title>/<pr-body> tags that we parse host-side. Best-effort
      // — a failure here falls back to a generated body, it never drops the PR.
      let pr: { title: string; body: string } | null = null;
      try {
        const describe = await sandbox.run({
          name: "describe",
          maxIterations: 1,
          // Low effort — summarizing a diff doesn't need deep reasoning.
          agent: claudeCode("claude-opus-4-8", { effort: "low" }),
          promptFile: "./.sandcastle/describe-pr-prompt.md",
          promptArgs: { BRANCH: issue.branch },
        });
        pr = parsePrDescription(describe.stdout);
      } catch (err) {
        console.error(
          `  ! ${issue.id}: PR-description step failed; using fallback body: ${err}`
        );
      }

      return { commits, pr };
    } finally {
      await sandbox.close();
    }
  })
);

// Log any pipelines that threw (network error, sandbox crash, etc.).
for (const [i, outcome] of settled.entries()) {
  const issue = issues[i];
  if (issue && outcome.status === "rejected") {
    console.error(
      `  ✗ ${issue.id} (${issue.branch}) failed: ${outcome.reason}`
    );
  }
}

// Only publish branches that actually produced commits, carrying the PR
// description the describe step generated (null → fall back at publish time).
const completed: {
  issue: (typeof issues)[number];
  pr: { title: string; body: string } | null;
}[] = [];
settled.forEach((outcome, i) => {
  const issue = issues[i];
  if (
    issue &&
    outcome.status === "fulfilled" &&
    outcome.value.commits.length > 0
  ) {
    completed.push({ issue, pr: outcome.value.pr });
  }
});

console.log(
  `\nExecution complete. ${completed.length} branch(es) with commits.`
);

if (completed.length === 0) {
  console.log("No commits produced. Nothing to publish.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Phase 3: Publish
//
// Push each completed branch to origin and open a PR against main. Done on the
// host (which is authed for git + gh); the sandbox's commits are already on the
// local branch ref via the bind-mounted .git. Nothing is merged — you review
// and merge each PR yourself.
// ---------------------------------------------------------------------------
console.log("\nOpening pull requests:");
for (const { issue, pr } of completed) {
  try {
    pushBranch(issue.branch);

    const existing = openPrNumber(issue.branch);
    if (existing !== null) {
      console.log(
        `  ↻ ${issue.id}: pushed updates to existing PR #${existing}`
      );
      continue;
    }

    // Agent-written title + body from the diff; fall back to the issue title and
    // a minimal body if the describe step didn't yield one.
    const title = pr?.title || issue.title;
    const lead = pr?.body ? `${pr.body}\n\n` : "";
    const body =
      `${lead}Closes #${issue.id}\n\n` +
      "_Automated by Sandcastle (implement → review). Leave review comments, " +
      "then run `bun run sandcastle:pr-comments <PR>` to have them addressed._";

    const url = createPr(issue.branch, title, body);
    console.log(`  ✓ ${issue.id} → ${url}`);
  } catch (err) {
    console.error(
      `  ✗ ${issue.id} (${issue.branch}) failed to publish: ${err}`
    );
  }
}

console.log(
  "\nAll done. Review and merge the PR(s) above. Re-run `bun run sandcastle` " +
    "after merging to pick up newly unblocked issues."
);
