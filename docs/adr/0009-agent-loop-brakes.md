---
status: accepted
---

# The agent loop runs on enforced checks

The repo now enforces the boundaries that were previously described in prose, and its agent instructions are harness-neutral. One convention file per area replaces the editor-specific rule files.

## Why

The Effect migration gave the server a typed dependency graph, but nothing stopped a later change from routing around it. The rule files lived in `.cursor/rules`, which only one editor loads, and two of them still described the pre-Effect layout. An agent could add `getDb()` to a service, widen an error channel, skip a test, or delete one, and CI stayed green.

The gate now fails on those changes at the point they are introduced. Each rule names the file and line, so the fix is the cause, not the report.

## Decision

- `scripts/check-boundaries.mjs` enforces the Effect and layering rules that a lint preset cannot express.
- `scripts/check-test-integrity.mjs` fails on a skipped or focused test and on test cases removed without the `test-deleted` label.
- CI calls `pnpm verify` once. The step list lives in `vite.config.ts`, so the local gate and the CI gate cannot drift.
- Branch protection for `main` will require the `test` and `e2e` checks, applied to administrators. Enable it once these checks exist on `main`; until then the gate is advisory.
- `AGENTS.md` is the entry point for every harness. Area rules live in `docs/conventions/`, written as positive instructions.

## Consequences

- A new service that reaches for ambient state fails before review.
- A weakened test is visible in the diff and fails the gate.
- The rules no longer depend on a specific editor or a `CLAUDE.md` shim.
- The scripts are regex checks, not an AST. A false positive gets a narrow allowance in the script, not a disabled rule.
- Deploy, migrations, and remote seeding stay human actions. See `docs/agents/reviewer.md`.
