# Coding Standards

The reviewer agent loads this during code review via `@.sandcastle/CODING_STANDARDS.md`,
so these standards are enforced at review time without costing tokens during
implementation. Keep it short and project-specific; the deeper domain rules live
in `CONTEXT.md`, `docs/adr/`, and `docs/agents/` (read via `docs/agents/domain.md`).

## Style

- `vp check` is the single static check (format + lint + types). `pnpm check`
  must pass with no changes left to make — never hand-format against it.
- Prefer named exports over default exports.
- Choose clarity over cleverness: explicit code over terse code, no nested
  ternaries (use `if`/`else` or `switch`), shallow nesting.
- Don't add comments that restate the code; comment the _why_, not the _what_.

## TypeScript

- No `any`, no unchecked casts, no non-null `!` to silence the compiler — model
  the types instead. `pnpm check-types` must pass.
- Validate external input at the boundary. Server env access goes through the
  `apps/web/env.ts` schema (`void/env`) — never read `process.env` directly or bypass it.

## Testing

- Server logic is covered by **integration tests** that mount the real Void
  route files on bare Hono and exercise them against in-memory **PGlite**
  through the `void/db` test alias. Do **not** mock the database.
- Tests must never connect to a cloud/production database. E2E uses the throwaway local Postgres only.
- Use descriptive test names that state the expected behaviour.
- New or changed behaviour must come with a test (red-green-refactor).

## Architecture

- This is a Vite+ monorepo (`apps/*`, `packages/*`). Use `pnpm run` and `vp run`
  tasks, never `npm`/`yarn`. Shared `catalog:` versions are defined at the workspace root.
- Persistence is Drizzle ORM; schema lives in `apps/web/db`. Schema
  changes go through `void db generate`/`void db migrate`, not ad-hoc SQL.
- Keep modules focused on a single responsibility; respect existing context/
  module boundaries documented in `CONTEXT.md` and the ADRs.
