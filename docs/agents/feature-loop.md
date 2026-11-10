# Feature loop

How an agent takes a feature from request to a mergeable PR without guessing
where things live. Read this with `CONTEXT.md`, the relevant ADRs, and the rule
file for the area you touch.

## Before code

1. Name the data shape first: fields, enum values, invariants, and state
   transitions. If a rule is pure, put it in `packages/shared/src/utils` and
   test it there.
2. Find the closest existing slice and copy its seams, not its code.
3. Decide whether the feature is a new domain or a new behavior in an existing
   one. A new domain is rare; most work extends People, Households, or
   Relationships.

## The slice

A full domain slice touches these paths. Departments is the next planned one.

| Layer               | Path                                 | Rule                                                                                    |
| ------------------- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| Constants and enums | `packages/shared/src/constants/`     | `*_VALUES` is the single source of truth                                                |
| Input contract      | `packages/shared/src/schema/`        | Zod schema plus inferred type; cross-field rules in `.refine()`                         |
| Table and migration | `apps/chms/src/db/schema/`           | Generate with `pnpm db:generate`; never hand-write SQL                                  |
| Domain logic        | `apps/chms/server/<domain>.ts`       | Reads via `getDb()`. Multi-write = read, compute in memory, one `db.batch`              |
| API route           | `apps/chms/src/routes/api/<domain>/` | Validate, call one domain function, return a plain value. Never import `db`             |
| Client type         | `apps/chms/src/types/api.ts`         | `RouteOutput` from the generated `RouteMap`; run `void prepare` first                   |
| Page                | `apps/chms/src/pages/`               | `<name>.tsx` plus `<name>.server.ts` with `loader`/`action`; read through `void/client` |
| UI                  | `apps/chms/src/components/`          | Feature components default export; UI primitives named exports                          |
| Tests               | `apps/chms/test/`                    | API integration using `test/fixtures.ts`                                                |
| E2E                 | `e2e/`                               | One spec per user flow that a page change can break                                     |

## Invariants that bite

- A missing record is `HTTPException(404)`. A plain `Error` maps to 500.
- D1 has no transactions. Never call `db.transaction()`; use one
  `getDb().batch([...])` after reading and computing every write.
- A Household owns the shared contact details and family name (ADR-0001). A
  Person's effective value is their own, else the Household's. Do not special
  case the Head.
- A spouse Relationship is the source of truth for Marital Status (ADR-0003).
  Read `server/marital-status.ts` before touching either.
- `isActive` is a soft-delete flag. Do not add a hard delete.

## Testing

- Test the behavior a caller or user observes. Do not assert a helper against
  its own output, and do not re-test a library's contract.
- Use `apps/chms/test/fixtures.ts`: `validHead`, `createPerson`,
  `createTwoPeople`, `postRelationship`, `json`. Add a fixture instead of
  copying a setup block into a new file.
- One test per rule, plus the failure path for that rule. A renamed helper
  should not break a test; a changed wire shape should.
- Keep unit tests deterministic. Pass a `referenceDate` instead of reading the
  wall clock.
- A page change needs an e2e spec. API tests do not prove hydration or that the
  loader rendered.

## Commands

```bash
pnpm dev          # app and API on :3001, local D1
pnpm test:watch   # fast unit/integration loop
pnpm test         # unit/integration once
pnpm verify       # CI test job: prepare, env, types, lint/format, drift, tests
pnpm verify:pr    # verify + build + Playwright against the built worker
pnpm db:seed      # destructive: reset local D1 and seed faker rows
pnpm db:migrate   # apply pending migrations
pnpm db:generate  # regenerate migrations from the schema
```

When a command fails, fix the cause in the same unit of work. `pnpm verify` is
the same chain CI runs; a green local run should mean a green PR.

## Definition of done

- `pnpm verify:pr` is green.
- Every new rule has a test that fails when the rule breaks.
- The PR body carries the command output, and a screenshot, recording, or trace
  for any UI change.
- No new layer. No repository, DI container, client query cache, or generic
  CRUD framework.

## Copy from

- API, D1 batch, and not-found: `apps/chms/server/people.ts`,
  `apps/chms/server/relationships.ts`
- Routes: `apps/chms/src/routes/api/people/`
- Loader and action: `apps/chms/src/pages/people/add.server.ts`
- Form and client mutation: `apps/chms/src/components/people/`
- Test harness: `apps/chms/test/routes.ts`, `apps/chms/test/void-db.ts`,
  `apps/chms/test/fixtures.ts`
