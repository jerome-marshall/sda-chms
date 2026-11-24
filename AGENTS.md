# AGENTS.md

sda-chms is a church management system for a Seventh-day Adventist congregation. One Void app in `apps/chms` serves the rendered pages and the JSON API from a single origin. Data lives in Cloudflare D1 through Drizzle. `packages/shared` holds the Zod schemas, constants, and pure rules.

## Start here

Read `CONTEXT.md` for domain vocabulary and `docs/adr/` for decisions before you change behavior.

Before you edit an area, read its convention file.

| Area                                         | File                               |
| -------------------------------------------- | ---------------------------------- |
| Repo layout, commands, naming, docs          | `docs/conventions/project.md`      |
| API, server modules, Effect services, errors | `docs/conventions/server.md`       |
| Schema, migrations, Drizzle, D1              | `docs/conventions/database.md`     |
| Pages, loaders, components, styling          | `docs/conventions/frontend.md`     |
| Shared schemas, constants, utils             | `docs/conventions/shared.md`       |
| Church domain rules                          | `docs/conventions/domain-rules.md` |

Building a feature: `docs/agents/feature-loop.md`.
Reviewing a diff: `docs/agents/self-review.md`.
Issue tracking and triage: `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`.

## Verify before you hand back

`pnpm verify` runs the CI gate. `pnpm verify:pr` adds Playwright against the built worker on local D1, so use it for any page or runtime change.

A green local run should mean a green PR. If a command fails, fix the cause in the same change.

## What the gate enforces

`pnpm verify` fails when:

- `Effect.runPromise` or `Effect.runSync` appears outside `apps/chms/server/effect/runtime.ts`, the tests, and the scripts.
- a module imports the `db` binding from `void/db` outside `apps/chms/server/db.ts`.
- a service under `apps/chms/server/effect/` calls `getDb()` or wraps work in `try/catch`.
- a route imports `void/db`, Drizzle, `@schema`, or anything under `server/` outside `server/effect/`.
- `as any` or `: any` appears in application code.
- an Effect error channel is `Error` or `unknown` instead of a named failure.
- `process.env` appears in domain code.
- a test is skipped or focused, or test cases are removed without the `test-deleted` label.
- the schema and the committed migrations disagree.
- a TypeScript suppression was added, a weaker test matcher replaced an exact one, or a new server export has no test in the diff.
- a pull request has an unticked box, the placeholder proof, an unnamed test, a UI change with no picture, or an undeclared one-way door.

Each rule names the file and line, so fix the cause rather than the report.

## Reviewing a change

`docs/agents/self-review.md` is the checklist, and it has two halves. The checked half is `pnpm verify`: a script fails the build, so you fix the cause instead of arguing with it. The decided half cannot be scripted, so you answer it in the pull request body, and `check:proof` refuses an empty or unanswered body.

There is no review service and no model in the gate. A second read is a fresh agent you start yourself, from the diff and the checklist, when the change is big enough to earn one. It does not block a merge, and it cannot approve one.
