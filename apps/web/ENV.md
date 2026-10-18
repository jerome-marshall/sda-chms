# Environment

The app needs one server variable. Void reads it from `apps/web/.env` —
the only dotenv file it accepts (it rejects `.env.example`, so the
example lives here instead of in a file).

## Required variables

| Variable     | Used by | Example                                                |
| ------------ | ------- | ------------------------------------------------------ |
| DATABASE_URL | server  | `postgres://postgres:password@localhost:5432/sda_chms` |

## Local setup

Create `apps/web/.env` from your shell (never commit it — `.env*` is
gitignored):

```bash
printf 'DATABASE_URL=%s\n' "postgres://postgres:postgres@localhost:5432/sda_chms" > apps/web/.env
```

Use the throwaway container from `docs/LOCAL_DATABASE_SETUP.md`, or point
at any Postgres you own. Seeding wipes every object in `public` first, so
only ever point it at a throwaway database — and only ever seed through
`pnpm db:seed`, which refuses non-local databases before connecting
(`SEED_ALLOW_REMOTE=true` overrides).

## CI

CI writes `apps/web/.env` from its own `DATABASE_URL` (the Postgres
service container — no secret is involved) before any Void command runs:

```bash
printf 'DATABASE_URL=%s\n' "$DATABASE_URL" > apps/web/.env
```

Production reads `DATABASE_URL` from the deploy environment (or Hyperdrive),
never from a file.
