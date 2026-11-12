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
Reviewing a diff: `docs/agents/reviewer.md`.
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

Each rule names the file and line, so fix the cause rather than the report.

## Reviewing a change

Every PR gets a second read against `docs/agents/reviewer.md`. The reviewer searches the diff for the listed patterns and asks for their removal. Review the diff, not the PR summary. CI runs the same list through `scripts/review-diff.mjs` on every PR, and a finding fails the job.
