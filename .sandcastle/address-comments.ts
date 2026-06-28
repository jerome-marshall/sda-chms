// Address review comments on Sandcastle-opened PRs.
//
// You review a PR, leave comments, then run this with the PR number(s). For each
// PR it checks out the PR branch in a sandbox, feeds the reviewer feedback to an
// agent, lets it make + commit changes and reply to the comments, then pushes
// the branch (which updates the PR). It never merges — you still merge yourself.
//
// Usage:
//   bun run sandcastle:pr-comments <PR_NUMBER> [<PR_NUMBER> ...]

import { claudeCode, createSandbox } from "@ai-hero/sandcastle";
import {
  copyToWorktree,
  hooks,
  prBranch,
  pushBranch,
  sandboxProvider,
} from "./shared";

const prs = process.argv
  .slice(2)
  .map((arg) => Number(arg))
  .filter((n) => Number.isInteger(n) && n > 0);

if (prs.length === 0) {
  console.error(
    "Usage: bun run sandcastle:pr-comments <PR_NUMBER> [<PR_NUMBER> ...]"
  );
  process.exit(1);
}

// Sequential: PRs are reviewed and merged one at a time, and serial logs are far
// easier to follow than interleaved parallel output.
for (const pr of prs) {
  const branch = prBranch(pr);
  console.log(`\n=== Addressing comments on PR #${pr} (${branch}) ===`);

  const sandbox = await createSandbox({
    branch,
    sandbox: sandboxProvider(),
    hooks,
    copyToWorktree,
  });

  try {
    const result = await sandbox.run({
      name: `address-pr-${pr}`,
      // A handful of iterations is plenty to address review feedback.
      maxIterations: 30,
      // High effort — interpreting and correctly applying human feedback is
      // exactly where deeper reasoning pays off.
      agent: claudeCode("claude-opus-4-8", { effort: "high" }),
      promptFile: "./.sandcastle/address-comments-prompt.md",
      promptArgs: { PR: String(pr), BRANCH: branch },
    });

    if (result.commits.length > 0) {
      pushBranch(branch);
      console.log(
        `  ✓ Pushed ${result.commits.length} commit(s) to ${branch}; PR #${pr} updated.`
      );
    } else {
      console.log(
        `  No code changes for PR #${pr} (the agent may have replied without changing code).`
      );
    }
  } catch (err) {
    console.error(`  ✗ PR #${pr} (${branch}) failed: ${err}`);
  } finally {
    await sandbox.close();
  }
}

console.log("\nDone. Re-review the updated PR(s) and merge when satisfied.");
