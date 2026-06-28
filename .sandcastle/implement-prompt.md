# TASK

Fix issue {{TASK_ID}}: {{ISSUE_TITLE}}

Pull in the issue using `gh issue view <ID>`. If it has a parent PRD, pull that in too.

Only work on the issue specified.

Work on branch {{BRANCH}}. Make commits and run tests.

# CONTEXT

Here are the last 10 commits:

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

# DOMAIN DOCS (read before exploring)

Before exploring the code, follow `docs/agents/domain.md`. It tells you which
domain documentation to read first (`CONTEXT.md`, the relevant `docs/adr/*`) so
your change respects the established domain model and prior decisions. This is
the single source of truth for doc-reading — do not skip it.

# EXPLORATION

Then explore the repo and fill your context window with relevant information that
will allow you to complete the task.

Pay extra attention to test files that touch the relevant parts of the code.

# EXECUTION

Use RGR (red-green-refactor) to complete the task.

1. RED: write one failing test. Prefer an **integration test** that drives the
   real code path (for the server, that means a test using the PGlite-backed
   `getDb`/`setTestDb` seam — never a mock of the database) over a shallow unit
   test. Only drop to a unit test when an integration test genuinely can't reach
   the behaviour.
2. GREEN: write the minimal implementation to pass that test.
3. REPEAT until done.
4. REFACTOR the code.

# FEEDBACK LOOPS

This is a Bun + Turborepo monorepo. Before committing, run all three and make
them pass:

1. `bun run check-types` — TypeScript across all packages.
2. `bun run test` — Vitest (server integration tests run against in-memory
   PGlite; safe and self-contained).
3. `bun run check` — Biome (formats + lints; this is the project's lint gate).

# DATABASE SAFETY (read carefully)

A throwaway Postgres runs locally in this sandbox, and `DATABASE_URL` already
points at it. The production database is NOT reachable from here.

- NEVER set `DATABASE_URL` to a cloud / Neon / production URL, and never hardcode
  one. Use the `DATABASE_URL` already in the environment.
- Do NOT run `bun run db:start` (it uses docker compose, which is unavailable
  here — Postgres is already running).
- You MAY run headless Playwright E2E. To do so: apply the schema to the local DB
  with `bun run db:push`, then run `bun run test:e2e` (Playwright is headless by
  default). E2E targets the local sandbox Postgres via `DATABASE_URL`.
- `bun run db:push` / `db:migrate` / seeding are only ever acceptable against this
  local sandbox DB — which is the only DB you can reach. Treat them as E2E setup,
  not as something to run "to be safe."

# COMMIT

Make a git commit. The commit message must:

1. Start with `RALPH:` prefix
2. Include task completed + PRD reference
3. Key decisions made
4. Files changed
5. Blockers or notes for next iteration

Keep it concise.

# THE ISSUE

If the task is not complete, leave a comment on the issue with what was done.

Do not close the issue - this will be done later.

Once complete, output <promise>COMPLETE</promise>.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
