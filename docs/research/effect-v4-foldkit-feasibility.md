# Effect v4 and Foldkit feasibility

Status: research note, 2026-11-10. No code changed.

Scope: evaluate moving the `sda-chms` backend to Effect v4 on the existing Hono
server, and moving the frontend to Foldkit. The goal is a codebase that is
easier for agents to extend without guessing.

## Verdict

**Backend: feasible, incremental, worth a spike.** Effect 4.1.3 is stable and
has a long support window. Hono can stay as the HTTP edge, and Effect can own
the domain behind a small adapter. The migration surface is about 1,200 lines
of server code, so a vertical slice is cheap to prove.

**Frontend: do not rewrite to Foldkit now.** Foldkit is a real Effect-native
framework with an unusually good agent story, but its server rendering is
explicitly experimental, it is pre-1.0, and it replaces React, Void, shadcn,
TanStack Table, Recharts, and React Hook Form. That is a rewrite of about 8,100
lines, not a migration. The app also handles personal church data, which makes
an experimental SSR path a poor fit today.

**Recommendation:** run a one to two day backend spike, keep React and Void,
and evaluate Foldkit through one embedded widget rather than a rewrite. If the
goal is agent legibility, the highest-leverage work is a canonical Effect slice,
vendored Effect source, and a few lint rules, not a simultaneous frontend
rewrite.

## What is actually available

| Item                          | Version | Status                                                                                                    | Source                       |
| ----------------------------- | ------- | --------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `effect`                      | 4.1.3   | Stable. 4.0 released 2026-09-30 and published to npm 2026-10-01, with a support window into 2029 or later | npm, Effect 4.0 announcement |
| `@effect/vitest`              | 4.1.3   | Same release train as Effect                                                                              | npm                          |
| `@effect/platform-node`       | 4.1.3   | Same release train                                                                                        | npm                          |
| `@effect/platform-cloudflare` | 4.1.3   | Same release train                                                                                        | npm                          |
| `@effect/platform-browser`    | 4.1.3   | Same release train                                                                                        | npm                          |
| `@effect/sql-d1`              | 4.1.3   | Official D1 client, marked `@stability unstable`                                                          | package types                |
| `@effect/atom-react`          | 4.1.3   | React bindings for Effect Atom                                                                            | npm, API reference           |
| `foldkit`                     | 0.170.0 | Pre-1.0, active, Effect peer `~4.1.0`                                                                     | npm, GitHub                  |
| `hono`                        | 4.13.x  | Existing server                                                                                           | npm                          |

Effect v4 consolidated most of the old `@effect/platform`, `@effect/rpc`, and
`@effect/cluster` surface into `effect` itself. `@effect/platform` has no 4.x
release. The core model is the same as v3, but the package imports and some
APIs changed. `Context.Tag` became `Context.Service`, `Effect.catchAll` became
`Effect.catch`, `Runtime<R>` was removed, and `HttpLayerRouter` was removed with
no single replacement. The v3 to v4 migration guide is a required read.

Several modules a server would rely on are still tagged `@stability unstable`,
including `effect/http`, `effect/sql`, and `effect/schema`. Unstable here means
a minor release can break the API. Pin the exact version and re-read the
installed types, not a blog post.

There is no first-party Hono runtime adapter. `@hono/effect-validator` 1.2.0
exists, but it only validates with Effect Schema. There are two integration
directions. Hono can own the HTTP edge and run Effect programs inside each
handler. Or Effect's `HttpRouter` can own the server and mount a Web fetch
handler with `HttpEffect.toWebHandler`, which would wrap Hono as a sub-app. The
practical choice here is Hono at the edge and Effect inside the handlers. It
keeps the current routing and Worker setup and adds only a run boundary.

## Current codebase, measured

| Area                          | Size                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Backend server and routes     | about 1,214 lines across 10 route files and 26 exported domain functions        |
| Frontend components and pages | about 8,094 lines, 65 component files, 26 shadcn primitives                     |
| Forms                         | 7 files using React Hook Form                                                   |
| Data grid and charts          | 8 data-grid files, 1 hook, 1 filter library, 2 chart files, all React-specific  |
| Unit and integration tests    | 24 files, 165 tests, about 2 seconds                                            |
| E2E                           | 1 Playwright spec with 4 tests                                                  |
| Database                      | Drizzle over Cloudflare D1, `void/db`, one `db.batch` per multi-write operation |
| Contracts                     | Zod at the boundary, `ApiErrorBody`, one error middleware                       |
| Zod surface                   | one shared schema file, about 40 schema calls                                   |

The backend is a good Effect candidate because its rules are already explicit:
typed domain errors, a single error mapper, one domain module per concept, and
D1 batch semantics. The frontend is a poor Foldkit candidate because its value
is concentrated in the React ecosystem: the data grid, charts, form library,
and 26 UI primitives.

## Backend feasibility

### What works

Hono stays the HTTP route layer under Void, and Void remains the Cloudflare
Worker entry. Each route handler validates input, then runs one Effect program.
The domain modules become services, and the handler is the only place that calls
`Effect.runPromise`.
`ManagedRuntime` is stable in v4, and `Effect.provideService` can supply a
request-scoped database service before the run.

The shape is small:

```ts
class Db extends Context.Service<Db, Database>()("Db") {}
const DbLive = Layer.sync(Db, () => getDb()); // Void's request-scoped D1

class People extends Context.Service<People, PeopleService>()("People") {}
const PeopleLive = Layer.effect(
  People,
  Effect.gen(function* () {
    const db = yield* Db;
    return {
      getAll: () => Effect.tryPromise(() => db.query.peopleTable.findMany()),
    };
  })
);

// Hono edge, per request
return Effect.runPromise(
  People.getAll.pipe(Effect.provide(PeopleLive), Effect.provide(DbLive))
);
```

The `Db` layer is built per handler invocation, so Void's request-scoped D1
instance stays request-scoped. A `ManagedRuntime` can cache stateless layers,
but the database layer must not be cached across requests. Typed errors replace
the current mix of `Error`, `HTTPException`, and `mapErrorToBody` inside the
domain. One `runApi` boundary maps the error channel to `ApiErrorBody` and the
HTTP status. That keeps the API contract stable while the internals become
explicit.

`@effect/vitest` gives the new services a test layer. The existing route tests
and the in-memory SQLite harness can stay while the migration is partial.

### What has to change

- Error taxonomy. The current plain `Error("Person not found")` becomes a typed
  `PersonNotFound` error, and the edge maps it to a 404 body.
- Service boundaries. `people`, `households`, `relationships`, `marital-status`,
  and `import` become services. The pure marriage rules can stay pure functions.
- Runtime ownership. One runtime for stateless services, plus a request-scoped
  `Db` service for the D1 binding. The exact binding access needs a spike
  because `void/db` already hides the request-scoped instance.
- Validation. Keep Zod at the Hono boundary first. Use Effect Schema inside the
  new domain only if the team accepts a second schema system during the
  transition. Do not run both forever. The Zod surface is small, one shared
  schema file with about 40 calls, so a later Effect Schema migration is
  bounded.
- Tests. Add `@effect/vitest` for service tests. Keep the existing API tests as
  the contract check until the routes are fully migrated.

### Persistence

`@effect/sql-d1` is the official D1 client. It was released on 2026-10-01, so
it is about five weeks old. Its own types mark it unstable and it does not
support transactions, streaming queries, or `updateValues`. It does support
D1's atomic `batch`, which is the operation this app relies on.

The current test harness is better-sqlite3, not a `D1Database`. Moving to
`@effect/sql-d1` would force a Miniflare or Workers test pool and would slow the
two-second loop. Wrapping Drizzle in `Effect.tryPromise` keeps the relational
queries and the batch-statement builders. **Keep Drizzle and wrap `getDb()` in
an Effect `Db` service for the first phase.** Revisit the SQL client when it is
stable and the test story is proven.

`@effect/vitest` 4.1.3 peers on Vitest 5, which this repo already has. Service
tests can use `it.effect` and test layers while the API integration tests stay
as they are.

### Backend sequence

1. **Spike, one to two days.** Add `effect` and `@effect/vitest`. Create
   `server/effect/runtime.ts`, a `Db` service over Drizzle, and a `People`
   service. Convert the pure marriage rules first because they are the least
   entangled, then migrate only `GET /api/people` and `GET /api/people/:id`.
   Keep the response bytes identical. Measure type errors, diff size, and agent
   output.
2. **Foundation, about a week.** Add the typed error taxonomy, the `runApi`
   boundary, the error-to-`ApiErrorBody` mapping, and the first `@effect/vitest`
   service tests. Write `docs/agents/effect-slice.md`.
3. **Domain migration.** Do relationships and marital status next, because they
   are the hardest and the most rule-heavy. Then households and import. Keep one
   `db.batch` per operation through the `Db` service.
4. **Persistence decision.** Evaluate `@effect/sql-d1` only after the service
   layer is stable. Do not migrate the driver and the domain in the same step.

Do not migrate Void file routing, Hono middleware, Drizzle queries and
relations, `test/void-db.ts`, the Zod form schemas, or the version-parity test.
They work, and moving them buys risk without changing the agent experience.

Stop after step 1 if the type errors are not actionable or agents produce worse
diffs than the current stack. A spike that is allowed to fail is the point.

### Backend risks

| Risk               | Why it matters                                                                    | Mitigation                                                                         |
| ------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| v4 is new          | Agents were trained mostly on v3 and may emit `@effect/platform` or `Context.Tag` | Pin 4.1.3, vendor the source, add an `AGENTS.md` pointer, read the migration guide |
| Two error systems  | Hono `HTTPException` and Effect typed errors can drift                            | One `runApi` adapter, one `ApiErrorBody` mapper, tests at the route boundary       |
| Request-scoped D1  | A global runtime cannot hold one request's binding                                | Provide `Db` per request; keep the runtime for stateless layers                    |
| Type complexity    | Large inferred types can slow agents and reviewers                                | Canonical slice, Effect LSP or tsgo, small services                                |
| Driver instability | `@effect/sql-d1` is unstable and changes the test harness                         | Keep Drizzle for now                                                               |
| Unstable modules   | `effect/http`, `effect/sql`, and `effect/schema` allow breaks in minors           | Pin 4.1.3, re-read installed types, avoid those modules in the first slice         |

## Frontend feasibility: Foldkit

### What Foldkit is

Foldkit is a TypeScript frontend framework built on Effect. It implements The
Elm Architecture:

- one `Model`, defined by an Effect `Schema`
- one closed `Message` union
- a pure `update(model, message)` that returns the next model and commands
- a pure `view(model, h)` that returns typed HTML data, not JSX
- `Command`, `Subscription`, `Mount`, and `ManagedResource` for effects
- typed bidirectional routing
- a headless `@foldkit/ui` component set
- Story and Scene tests that do not need a browser or a DOM
- DevTools and an MCP server that expose the Model and Message history

It is not a React wrapper. It has its own runtime and a virtual DOM built on
Snabbdom. There is no JSX and no React renderer.

### Server rendering

Foldkit does support SSR, but it ships from `foldkit/experimental/server`. The
docs say the API may change in any release, has not had broad production
exposure, and recommends waiting for the stable export for regulated or
security-critical workloads. A church management system holds personal data, so
that warning applies.

Two consequences matter:

- Commands do not run during a server render. Data must be resolved in
  `entry.server.ts` and passed through `Flags` before `init`. The current loader
  model would be redesigned, not ported.
- A document can have one hydratable Foldkit root. A Foldkit page owns the
  document, including routing and metadata. There is no islands model for SSR.

The emitted server bundle is a Web `fetch` handler, and the docs say a Worker
can default-export it. A Hono API could still sit beside it, which preserves
ADR-0005's contract, but the page host and build pipeline would be new.

### React and the component ecosystem

Foldkit cannot reuse React components. `Runtime.embed` only goes one direction:
a Foldkit widget inside a React host. A hydrated Foldkit page cannot contain a
React tree. That rules out keeping shadcn, Radix, Base UI, TanStack Table,
Recharts, React Hook Form, Sonner, or `lucide-react` inside the page.

Tailwind survives. Foldkit views emit ordinary classes, and the theme tokens can
port. But the 26 shadcn primitives and the 65 component files are a rewrite. The
Foldkit UI package has dialogs, menus, tabs, listboxes, a calendar, a date
picker, a toast, drag and drop, and a virtual list. It has no data grid and no
chart component. The People data grid and the dashboard charts would have to be
built again or embedded as React widgets.

### Migration cost

A full migration rewrites:

- all 5 routes and 11 page files
- the layout, sidebar, header, breadcrumbs, and theme provider
- 65 component files and 26 shadcn primitives
- 7 forms, from React Hook Form to Model and `FieldValidation`
- every loader and action, from API fetches to server-side Flags and Commands
- the TanStack Table data grid and the Recharts dashboard
- the component test and the Playwright selectors

What stays: Hono, Drizzle, D1, the shared Zod schemas (re-expressed for the
Model), the API contract, Tailwind tokens, the Playwright runner, and the
backend tests.

There is no page-by-page migration. The only incremental path is
`Runtime.embed`, which mounts a client-only Foldkit widget inside an existing
React page. That is a useful spike, not a migration strategy.

### Maturity

As of 2026-11-10:

- `foldkit@0.170.0`, published 2026-10-29
- pre-1.0, with frequent explicit breaking changes, including a minor release
  that bumped the Effect peer to 4.1
- 1,220 GitHub stars, 69 forks
- 301 open issues and 136 open pull requests
- one npm maintainer
- 531 published versions in about 14 months
- 36 example applications and about 1,000 test files in the repository

That is an active, well-documented project. It is not a production foundation
for a small app with one maintainer. The experimental SSR warning is the
decisive part.

### Agent ergonomics

Foldkit is unusually legible for agents:

- one closed Message union, so a new message produces compile errors everywhere
  it must be handled
- a pure `update`, so Story tests need no DOM
- Commands as values that tests can assert without running the effect
- DevTools MCP, so an agent can inspect the Model, replay Messages, and dispatch
  new ones
- vendored source, `FOLDKIT.md`, skills, `llms.txt`, and markdown docs

The costs are just as real:

- a feature touches Model, Message, update, view, Flags, and Command across
  several files
- React instincts mislead, because `useEffect` maps to Subscription and
  `useMemo` maps to view memoization
- the API changes monthly, so stale docs or a stale vendored copy can steer an
  agent to APIs that no longer exist

The agent story is better than React's on paper. The maturity risk is worse
than React's in practice.

## Impact on the current verification loop

The backend migration fits the existing loop. `pnpm verify` stays the gate.
`@effect/vitest` can run beside the current Vitest projects, and the API
integration tests can keep mounting the real routes. The new work is a second
test style, service tests with test layers, plus a typecheck that will be slower
because Effect types are larger. Keep the route tests as the contract check.

A Foldkit migration would replace more of the loop. The Vite plugin and SSR host
change the build, the Playwright selectors and page flows are rewritten, and the
e2e job would need a different preview path. That is another reason not to run
the frontend rewrite and the backend migration in the same period.

## Rough effort

| Work                                     | Size                                | Assumption                                                   |
| ---------------------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| Backend vertical slice, two People reads | S, 1 to 2 days                      | One developer or one agent with review                       |
| Backend full domain migration            | M, 2 to 4 weeks                     | Keep Drizzle and the current tests; no persistence rewrite   |
| Foldkit spike, one embedded widget       | S, 3 to 5 days                      | Client-only, no SSR, no data grid                            |
| Foldkit whole app                        | XL, 6 to 12 weeks, high uncertainty | Full rewrite, experimental SSR, data grid and charts rebuilt |

The Foldkit estimate is the least reliable. The data grid and the charts are
the unknown, and they are the parts the app uses most.

## Options

| Option                                    | SSR             | React and shadcn | Effect-native           | Migration                       | Risk   | Judgment                             |
| ----------------------------------------- | --------------- | ---------------- | ----------------------- | ------------------------------- | ------ | ------------------------------------ |
| Current stack, Effect only on the backend | Stable          | Full             | Backend only            | Small                           | Low    | Recommended                          |
| React 19 + Void + Effect Atom             | Stable          | Full             | State layer             | Low to medium                   | Low    | Good next step if client state grows |
| Foldkit widget via `Runtime.embed`        | No, client-only | Isolated         | Complete for the widget | Small                           | Medium | Spike only                           |
| Foldkit whole app                         | Experimental    | None             | Complete                | Full rewrite, about 8,100 lines | High   | Not now                              |

`@effect/atom-react` 4.1.3 is the low-risk way to bring Effect into the current
React app. It provides reactive atoms, async results, Suspense hooks, and
Effect services without changing the renderer. It is worth a separate spike if
client state becomes a problem.

## Recommended path

1. **Backend spike.** One vertical slice, two routes, typed errors, a `Db`
   service, and `@effect/vitest`. Keep the API bytes and the current tests.
2. **Agent setup.** Vendor `repos/effect` at 4.1.3 with a squashed git subtree.
   Add an `AGENTS.md` section that says to read the vendored source before
   writing Effect code. Write one `docs/agents/effect-slice.md` with the
   canonical route, service, error, and test pattern.
3. **Encode the boundaries.** Add lint rules or code review rules: `runPromise`
   only in route adapters, no `try/catch` inside domain services, no `any`, one
   `ApiErrorBody` mapper, no second schema system in the same slice.
4. **Measure.** Compare the slice against the current People slice on diff size,
   first-pass type errors, test time, and agent review comments. Set the kill
   criteria before starting.
5. **Frontend.** Keep React and Void. If you want a Foldkit taste, embed one
   widget such as the relationships section with `Runtime.embed`, timebox it to
   a week, and do not touch SSR. Revisit Foldkit when `foldkit/server` is stable
   and the UI package has a data grid and a chart story.

## Kill criteria for the backend spike

Stop and keep the current backend if any of these holds:

- the adapter needs more than about 50 lines per route
- the Effect type errors are slower to resolve than the current runtime errors
- the route tests need a new database harness
- the agent produces a larger or less consistent diff than the current slice
- the spike cannot preserve the `ApiErrorBody` contract without special cases

## Open questions

- How does a Void route expose the request-scoped D1 binding to a per-request
  Effect layer? `void/db` hides it today.
- Do we standardize on Effect Schema, or keep Zod at the boundary and use
  Effect Schema only inside the domain?
- Is the team willing to accept Effect's type complexity in exchange for
  explicit error and dependency channels?
- Does a per-request `Effect.runPromise` add measurable cold-start or bundle
  cost on the Worker? No benchmark was found.
- When does Foldkit promote `foldkit/experimental/server` to a stable export?
- Does Foldkit plan a data grid or chart layer, or is embedding the intended
  answer for those cases?

## Sources

- Effect 4.0 announcement: https://effect.website/blog/releases/effect/40
- Effect v4 docs: https://effect.website/docs/v4
- Effect v3 to v4 migration guide: https://github.com/Effect-TS/effect/blob/main/MIGRATION.md
- Effect coding with agents: https://effect.website/blog/the-one-weird-git-trick-that-makes-coding-agents-more-effect-ive/
- Effect HTTP API reference: https://effect.website/docs/v4/api/http
- `@effect/sql-d1` package types, version 4.1.3
- `@effect/atom-react` API reference: https://effect.website/docs/v4/api/atom-react
- Foldkit home: https://foldkit.dev/
- Foldkit server rendering: https://foldkit.dev/core/server-rendering
- Foldkit embedding: https://foldkit.dev/core/embedding
- Foldkit testing: https://foldkit.dev/testing
- Foldkit UI: https://foldkit.dev/ui/overview
- Foldkit AI: https://foldkit.dev/ai/overview
- Foldkit vs React + Effect Atom: https://foldkit.dev/react/foldkit-vs-react-effect-atom
- Foldkit GitHub repository and releases: https://github.com/foldkit/foldkit
- npm metadata for `effect@4.1.3`, `@effect/sql-d1@4.1.3`, `@effect/vitest@4.1.3`, `@effect/platform-*@4.1.3`, `foldkit@0.170.0`
