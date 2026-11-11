# Feature loop

How to take a feature from request to a mergeable PR without guessing where things live. Read this with `CONTEXT.md`, the relevant ADRs, and the convention file for the area you touch.

## Before code

1. Name the data shape first: fields, enum values, invariants, and state transitions. If a rule is pure, put it in `packages/shared/src/utils` and test it there.
2. Find the closest existing slice and copy its seams, not its code.
3. Decide whether the feature is a new domain or a new behavior in an existing one. A new domain is rare. Most work extends People, Households, or Relationships.

## The slice

A full domain slice touches these paths. Departments is the next planned one.

| Layer               | Path                                  | Rule                                                                  |
| ------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Constants and enums | `packages/shared/src/constants/`      | `*_VALUES` is the single source of truth                              |
| Input contract      | `packages/shared/src/schema/`         | Zod schema plus inferred type. Cross-field rules in `.refine()`       |
| Table and migration | `apps/chms/src/db/schema/`            | Generate with `pnpm db:generate`. Never hand-write SQL                |
| Service             | `apps/chms/server/effect/<domain>.ts` | One `Context.Service` that owns the rules and the typed failures      |
| Query helpers       | `apps/chms/server/<domain>.ts`        | Drizzle reads and batch builders. Takes `db` as the first argument    |
| API route           | `apps/chms/src/routes/api/<domain>/`  | Validate, call one program, return `runApi(...)`                      |
| Client type         | `apps/chms/src/types/api.ts`          | `RouteOutput` from the generated `RouteMap`. Run `void prepare` first |
| Page                | `apps/chms/src/pages/`                | `<name>.tsx` plus `<name>.server.ts` with `loader` and `action`       |
| UI                  | `apps/chms/src/components/`           | Feature components default export. Primitives named export            |
| Tests               | `apps/chms/test/`                     | Route contract in `test/routes/`, service rules in `test/effect/`     |
| E2E                 | `e2e/`                                | One spec per user flow that a page change can break                   |

A route validates, calls one program from `apps/chms/server/effect/<domain>.ts`, and returns `runApi(...)`. Read `docs/conventions/server.md` before adding or changing a server rule.

## Invariants that bite

- A missing record is a typed `NotFound` failure that maps to 404. A plain `Error` maps to 500.
- D1 has no transactions. Never call `db.transaction()`. Read, compute every write in memory, then run one `db.batch([...])`.
- A Household owns the shared contact details and family name, per ADR-0001. A person's effective value is their own, otherwise the Household's. Do not special case the head.
- A spouse Relationship is the source of truth for Marital Status, per ADR-0003. Read `server/marital-status.ts` before touching either.
- A person is deceased only when membership status is deceased.
- `isActive` is a soft-delete flag. Do not add a hard delete.

## Testing

- Test the behavior a caller or a user observes. Do not assert a helper against its own output, and do not re-test a library.
- Use `apps/chms/test/fixtures.ts`: `validHead`, `createPerson`, `createTwoPeople`, `postRelationship`, `json`. Add a fixture instead of copying a setup block.
- One test per rule, plus the failure path for that rule. A renamed helper should not break a test. A changed wire shape should.
- Keep unit tests deterministic. Pass a `referenceDate` instead of reading the wall clock.
- A page change needs an e2e spec. API tests do not prove hydration or that the loader rendered.
- A rule that lives in a service needs a test under `test/effect/` that provides a layer over `DbLive`.

## Commands

```bash
pnpm dev          # app and API on :3001, local D1
pnpm test:watch   # fast loop
pnpm test         # unit and integration once
pnpm verify       # the CI gate
pnpm verify:pr    # verify, build, and Playwright against the built worker
pnpm db:seed      # destructive: reset local D1 and seed
pnpm db:migrate   # apply pending migrations
pnpm db:generate  # regenerate migrations from the schema
```

When a command fails, fix the cause in the same change. `pnpm verify` is the same chain CI runs.

## Definition of done

- `pnpm verify:pr` is green.
- Every new rule has a test that fails when the rule breaks.
- The PR body carries the command output, and a screenshot, recording, or trace for any UI change.
- The reviewer search list in `docs/agents/reviewer.md` comes back clean.
- No new layer. No repository, DI container, client query cache, or generic CRUD module.

## Copy from

- Service, typed failure, and route edge: `apps/chms/server/effect/people.ts`, `apps/chms/server/effect/errors.ts`, `apps/chms/server/effect/runtime.ts`
- Query helpers and batches: `apps/chms/server/people.ts`, `apps/chms/server/relationships.ts`
- Routes: `apps/chms/src/routes/api/people/`
- Loader and action: `apps/chms/src/pages/people/add.server.ts`
- Form and client mutation: `apps/chms/src/components/people/`
- Test harness: `apps/chms/test/routes.ts`, `apps/chms/test/void-db.ts`, `apps/chms/test/fixtures.ts`
