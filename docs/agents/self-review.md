# Self-review

Run this before you open a pull request. There is no review service, no API key, and no model in the gate.

The list has two halves. Do not mix them:

- **Checked** — `pnpm verify` fails when you get it wrong, in CI and in the pre-push hook. You do not need to reason about these. Run the command.
- **Decided** — a script cannot decide it. You write the answer in the pull request body, and `check:proof` refuses a body that left it blank or kept the template text. A person reads it before the change lands.

A script proves the change is shaped correctly. It cannot prove the change is right. That last part is a person's job, not a model's.

## Checked by `pnpm verify`

| What                                                                                                            | Script             |
| --------------------------------------------------------------------------------------------------------------- | ------------------ |
| A skipped, focused, or deleted test                                                                             | `check:tests`      |
| An Effect boundary violation, `any`, a widened error channel, `process.env` in domain code                      | `check:boundaries` |
| A TypeScript suppression, a weaker assertion replacing an exact one, a new server or shared export with no test | `check:diff`       |
| A schema change without a regenerated migration                                                                 | `db:drift`         |
| An unticked box, a placeholder proof, an unnamed test, a UI change with no picture, an undeclared one-way door  | `check:proof`      |

Deleting a test file is allowed when the source file it covered is deleted in the same diff. Deleting only the test still fails, and still needs the `test-deleted` label.

## Decided by you

Answer each in `## Proof` or `## One-way doors`, in your own words. Short is fine. Empty is not.

- Does the test assert the behaviour a caller sees, or does it call the implementation?
- Does the change add a layer, a duplicated rule, or a generic abstraction the repo did not have?
- Is the data shape named, and does the diff match that shape?
- Is this the smallest change that fixes the cause?
- Is any part of this a one-way door that a person must take?

## A second read

Optional, and worth it for a change that touches a rule, a migration, or auth.

Start a fresh agent with no conversation history and give it `git diff <base>...HEAD` and this file. It has no memory of why you wrote the code, so it reads what the diff says. Close it when it is done. It is a reader, not a check: its output does not block a merge, and it cannot approve one.

## Finding format

A finding needs a file and a line: `path:line  [severity]  what to remove`. Severity is blocker, high, or medium. If you cannot name the line, it is a question, not a finding.

## One-way doors

Name these in the pull request body even when the diff is small: a migration, a deploy or preview promotion, a secret or environment change, an auth change, a remote seed or bulk import, a change to the gate workflows, and any notification that leaves the system.
