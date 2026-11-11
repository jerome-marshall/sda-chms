# Reviewer

Read the diff, not the PR summary. Search for each pattern below and ask for its removal. A finding needs a file and a line, or it is not a finding.

## Tests

- A deleted test case, or a test file removed with the code it covered.
- A test that now asserts less: `toStrictEqual` became `toBeTruthy`, an exact message became `toContain`, a real value became a snapshot.
- `.skip`, `.only`, `.todo`, `xit`, or `xtest` added.
- A new rule with no test that fails when the rule breaks.
- A test that calls the implementation instead of the behavior a caller sees.

## Effect boundary

- `Effect.runPromise` or `Effect.runSync` outside `apps/chms/server/effect/runtime.ts`.
- `try/catch` or a bare `throw` inside `apps/chms/server/effect/`, except `runtime.ts`, which throws at the edge.
- `getDb()` inside a service, or a `db: Database = getDb()` default parameter.
- An error channel widened to `Error`, `unknown`, or `ApiError` where a named tag belongs.
- A route that imports `void/db`, Drizzle, or a server module.
- A promise that is not lifted through `fromDb` or `Effect.tryPromise`.

## Types and boundaries

- `any`, `as any`, `@ts-ignore`, or `@ts-expect-error`.
- Zod validation repeated inside a service that already received typed input.
- A hand-written migration SQL file.
- `process.env` in domain code.
- A new generic layer: repository, CRUD framework, client query cache.

## Proof

- A PR with no command output.
- A UI change with no screenshot, recording, or trace.
- A behavior change whose test was not shown failing first.
- A migration with no drift output.

## Report format

List findings as `path:line  [severity]  what to remove`. Severity is blocker, high, or medium. End with one line: `REVIEW: clean` when nothing is found, otherwise `REVIEW: <count> findings`.

## One-way doors

Flag these for a human even when the diff is small: a migration, a deploy or preview promotion, a secret or environment change, an auth change, a remote seed or bulk import, and any notification that leaves the system.
