# Coding Standards

The reviewer agent loads this during code review via `@.sandcastle/CODING_STANDARDS.md`,
so these standards are enforced at review time without costing tokens during
implementation. Keep it short and project-specific; the deeper domain rules live
in `CONTEXT.md`, `docs/adr/`, and `docs/agents/` (read via `docs/agents/domain.md`).

## Style

- Biome is the single formatter + linter. `bun run check` must pass with no
  changes left to make — never hand-format against it.
- Prefer named exports over default exports.
- Choose clarity over cleverness: explicit code over terse code, no nested
  ternaries (use `if`/`else` or `switch`), shallow nesting.
- Don't add comments that restate the code; comment the *why*, not the *what*.

## TypeScript

- No `any`, no unchecked casts, no non-null `!` to silence the compiler — model
  the types instead. `bun run check-types` must pass.
- Validate external input at the boundary. Environment access goes through the
  `@sda-chms/env` schema — never read `process.env` directly or bypass it.

## Testing

- Server logic is covered by **integration tests** that exercise the real code
  path against in-memory **PGlite**, injected via the `getDb`/`setTestDb` seam.
  Do **not** mock the database.
- Tests must never connect to a cloud/production database. Vitest pins a dummy
  `DATABASE_URL`; E2E uses the throwaway local Postgres only.
- Use descriptive test names that state the expected behaviour.
- New or changed behaviour must come with a test (red-green-refactor).

## Architecture

- This is a Bun + Turborepo monorepo (`apps/*`, `packages/*`). Use `bun run`,
  never `npm`/`yarn`. Shared `catalog:` versions are defined at the workspace root.
- Persistence is Drizzle ORM; schema lives in the `@sda-chms/db` package. Schema
  changes go through Drizzle, not ad-hoc SQL.
- Keep modules focused on a single responsibility; respect existing context/
  module boundaries documented in `CONTEXT.md` and the ADRs.
