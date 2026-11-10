# Effect slice

How backend code is written now that the domain runs on Effect 4. Read this
with `CONTEXT.md`, ADR-0008, and the server rules.

## Layers

| Layer   | Path                       | Owns                                                                 |
| ------- | -------------------------- | -------------------------------------------------------------------- |
| Route   | `apps/chms/src/routes/api` | Void file routing, Hono handlers, Zod validation, `runApi`           |
| Service | `apps/chms/server/effect/` | One Effect service per domain; the only place business rules compose |
| Helper  | `apps/chms/server/*.ts`    | Drizzle queries, batch builders, pure transformers; takes `db`       |
| Edge    | `server/effect/runtime.ts` | `AppLive` and the only `Effect.runPromise`                           |

`server/db.ts` still names the Drizzle type and `getDb()`. Only `DbLive` and
single-write test/seed wrappers call `getDb()`; every service receives the
request's database through the `Db` service.

## Canonical route

```ts
import { defineHandler } from "void/handler";

import { getPersonRelationships } from "../../../../../server/effect/relationships";
import { runApi } from "../../../../../server/effect/runtime";

export const GET = defineHandler.withValidator({ params: paramsSchema })(
  (_c, { params }) => runApi(getPersonRelationships(params.personId))
);
```

A route validates, calls one exported program, and returns `runApi(...)`.
Route files never import `db`, a Drizzle table, or a service layer.

## Canonical service

```ts
class Example extends Context.Service<Example, ExampleService>()("Example") {}

const ExampleLive = Layer.effect(
  Example,
  Effect.gen(function* ExampleLive() {
    const db = yield* Db;
    return {
      get: (id: string) =>
        Effect.gen(function* getProgram() {
          const row = yield* fromDb(() => readRow(db, id));
          if (!row) {
            return yield* Effect.fail(new ExampleNotFound({ id }));
          }
          return row;
        }),
    };
  })
);
```

- `Context.Service`, never `Context.Tag`.
- `Effect.catch`, never `Effect.catchAll`.
- `Effect.tryPromise` only through `fromDb`, which keeps the rejection as the
  `DatabaseFailure` cause.
- Domain failures live in `server/effect/errors.ts`. Add a class, add it to
  `DomainError`, and add its status/message to `describe`; nothing else maps a
  status.
- `runApi` turns a domain failure into the `HTTPException` the existing
  middleware already renders as `ApiErrorBody`. A `DatabaseFailure` rethrows
  its original cause, so the constraint, Zod, and unknown-error mapping in
  `server/lib/errors.ts` still applies unchanged.

## D1 batches

A multi-write operation reads first, computes every write in memory, then
issues one `db.batch([...])` through the injected database. Batch builders
(`insertPersonStmt`, `updateHouseholdStmt`, …) take `db` as their first
argument. Do not call `db.transaction()`.

## Tests

- `apps/chms/test/routes/**` stays the wire contract. Do not replace it.
- Service tests use `@effect/vitest` (`test/effect/**`). They provide a small
  layer over `DbLive`, so the in-memory SQLite harness is the same one the
  route tests use.
- Keep `vitest` pinned and `@types/node` on the workspace catalog. Effect's
  test helpers and Vite+ must resolve one vitest instance; two copies fail
  with "Vitest failed to find the current suite".

## Commands

`pnpm verify` is the gate. `pnpm verify:pr` adds the build and Playwright.
