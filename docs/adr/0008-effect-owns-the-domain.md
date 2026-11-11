---
status: accepted
---

# Effect owns the domain behind the Hono API

The backend keeps Void file routing, Hono, Drizzle, D1, Zod at the boundary,
and the `ApiErrorBody` contract. Behind each handler the domain runs on Effect
4.1.3: one `Db` service wraps the request-scoped `getDb()`, one service per
domain owns the rules, and one `runApi` edge runs the program and maps its
error channel.

## Why

The domain already had explicit rules, typed-ish errors, and one error mapper,
but each route mixed validation, queries, rule checks, and HTTP exceptions in
the same function. Effect makes the dependencies and failure cases part of the
type, so a new slice has one obvious seam: add a service method, add its error
to the taxonomy, call it from the route.

The feasibility report measured about 1,200 lines of server code and proposed a
two-route spike. The spike and the following slices kept the response bytes and
every existing route test, so the boundary is proven rather than assumed.

## Considered options

- **Effect's `HttpRouter` owns the server.** Rejected: it replaces Void file
  routing, the Worker entry, and the Hono middleware for no domain benefit.
- **`@effect/sql-d1` replaces Drizzle.** Rejected: the driver is unstable and
  would force a Miniflare or Workers test pool, replacing the two-second
  in-memory SQLite harness.
- **A global `ManagedRuntime`.** Rejected: D1 is request-scoped. A cached layer
  would share one request's binding with another. `AppLive` is built per run.
- **Keep the plain domain functions and call them from Effect.** Rejected: the
  `Db` service would be decorative and service tests would not exercise the
  same database seam as production.
- **Effect domain behind Hono (chosen).** One new boundary, no routing or
  persistence rewrite.

## Consequences

- `server/effect/` holds the services and the only `Effect.runPromise`.
  `server/effect/runtime.ts` composes `AppLive` and owns `runApi`.
- `server/*.ts` keeps Drizzle queries, lazy batch builders, and pure
  transformers. They take `db: Database` instead of reaching for `getDb()`, so
  a service can inject the request's database.
- Unstable Effect modules (`effect/http`, `effect/sql`, `effect/schema`) are not
  used. Zod stays at the HTTP boundary. Pin the exact Effect version.
- The existing `ApiErrorBody` mapper is still the only body builder. Typed
  domain errors map to `HTTPException`; infrastructure failures rethrow their
  original cause so constraint mapping is unchanged.
- `@effect/vitest` service tests sit beside the route tests and use `DbLive`
  over the same in-memory SQLite harness. `vitest` is pinned and `@types/node`
  follows the workspace catalog so the runner and Effect share one instance.
- A future driver change is separate work: do not migrate Drizzle and the
  domain in one step.
