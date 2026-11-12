# Server conventions

Read this before you change anything under `apps/chms/src/routes`, `apps/chms/server`, or `apps/chms/src/middleware`.

## Layers

```
Route adapter  ->  Effect service  ->  Drizzle helper  ->  D1
```

| Layer   | Path                                 | Owns                                                           |
| ------- | ------------------------------------ | -------------------------------------------------------------- |
| Route   | `apps/chms/src/routes/api/`          | Void file routing, Hono handlers, Zod validation, `runApi`     |
| Service | `apps/chms/server/effect/`           | The rules for one domain, typed failures, the `Db` requirement |
| Helper  | `apps/chms/server/<domain>.ts`       | Drizzle queries, batch builders, pure transformers             |
| Edge    | `apps/chms/server/effect/runtime.ts` | `AppLive`, the only `Effect.runPromise`                        |

`apps/chms/server/db.ts` names the Drizzle type and returns the request-scoped binding through `getDb()`. It is the only module that imports `db` from `void/db`. Helpers receive `db: Database` as a parameter.

## Routes

- One file per URL shape: `people/index.ts` for GET and POST, `people/[id].ts` for GET and PUT.
- Export one handler per method with `defineHandler`.
- Validate every body and param with Zod from `@sda-chms/shared/schema/*` through `defineHandler.withValidator`.
- Call one exported Effect program and return `runApi(program)`.
- Never import `db`, a Drizzle table, `@schema`, or a helper under `server/` outside `server/effect/`.
- Two handlers return a `Response` instead of a value: `routes/api/index.ts` and `routes/api/[...path].ts` return `c.json(..., 404)` for the API 404 contract. List any new exception in the PR.

```ts
export const GET = defineHandler.withValidator({ params: paramsSchema })(
  (_c, { params }) => runApi(getPersonById(params.id))
);
```

## Services

- One `Context.Service` per domain in `apps/chms/server/effect/<domain>.ts`.
- The service owns the rules. Helpers only read and write.
- Declare every failure in the return type. The channel is a union of named `Data.TaggedError` classes, never `Error` or `unknown`.
- Use `Effect.gen` and `yield*`. Use `Effect.catch`, not `Effect.catchAll`.
- Get the database from `yield* Db`. Never call `getDb()` in a service.
- Do not use `try/catch`. Use `fromDb` for a promise, `Effect.try` for a throw, or `Effect.fail` for a rule.
- Add a new domain rule failure by adding a class in `server/effect/errors.ts`, adding it to `DomainError`, and adding its status and message to `describe`. Nothing else maps a status.
- An infrastructure fault is an `InfraError` carrying its cause. A broken internal assumption is `internalFailure`, which returns an `InvariantError`.

```ts
export const getPersonById = (id: string) =>
  Effect.gen(function* getPersonByIdProgram() {
    const people = yield* People;
    return yield* people.getById(id);
  });
```

## Errors

`server/effect/errors.ts` names every failure, and `runtime.ts` maps each of the three groups once (ADR-0010).

- `DomainError` is a broken rule: a missing Person or Relationship, a Marital Status conflict, a spouse state on a non-spouse link, a second Head in a Household, an import limit. `describe` gives it its 404, 400, or 409, `toHttpException` builds the body.
- `InfraError` is a database or transport fault. It carries the original cause, and `runtime.ts` rethrows that cause so the constraint mapping is unchanged.
- `InvariantError` is a broken internal assumption. It carries the message for the log, and the body is a generic 500 with no developer text.
- `HTTPException` is the HTTP contract. `server/effect/errors.ts` builds one and `runtime.ts` throws it.
- `ZodError` and Drizzle constraint failures are mapped in `apps/chms/server/lib/errors.ts` and the API middleware.
- A missing record is a 404. A rule violation is a 400, except a Household that would gain a second Head, which is a 409. An infrastructure failure is a 500 and never puts SQL or bound values in the body.
- Do not catch an error to rethrow or format it. Let it reach the edge. A helper that throws keeps its throw; the service recovers it by tag, as the import limit does.

## D1 writes

D1 has no interactive transactions. Never call `db.transaction()`.

A multi-write operation reads first, computes every write in memory, then issues one `db.batch([...])`. The batch is one SQL transaction. Build statements with the lazy `*Stmt` helpers so an id generated in the same operation can be referenced without a round trip. Generate ids with `crypto.randomUUID()`.

## Tests

- `apps/chms/test/routes/**` is the wire contract. Keep it.
- Service tests use `@effect/vitest` under `apps/chms/test/effect/`. Provide `DbLive` over the in-memory SQLite harness so the service exercises the same seam as production.
- A rule needs a test that fails when the rule breaks. Name the failure path too.

## Avoid

- A second layer between a route and a service.
- A service that reaches for the ambient database.
- A new `DomainError` tag that maps to no status.
- A generic CRUD or repository module.
