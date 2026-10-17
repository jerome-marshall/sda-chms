# Environment

The app needs one server variable. Void reads it from `apps/web/.env` —
the only dotenv file it accepts (it rejects `.env.example`, so the
example lives here instead of in a file).

## Required variables

| Variable     | Used by | Example                                                 |
| ------------ | ------- | ------------------------------------------------------- |
| DATABASE_URL | server  | `postgres://postgres:postgres@localhost:55432/sda_chms` |

## Local setup

Create `apps/web/.env` from your shell (never commit it — `.env*` is
gitignored):

```bash
printf 'DATABASE_URL=%s\n' "postgres://postgres:postgres@localhost:5432/sda_chms" > apps/web/.env
```

Use the throwaway container from `docs/LOCAL_DATABASE_SETUP.md`, or point
at any Postgres you own. Seeding (`void db seed --yes`) wipes every object
in `public` first, so only ever point it at a throwaway database.

## CI

CI writes `apps/web/.env` from the `DATABASE_URL` secret before any Void
command runs:

```bash
printf 'DATABASE_URL=%s\n' "$DATABASE_URL" > apps/web/.env
```

Production reads `DATABASE_URL` from the deploy environment (or Hyperdrive),
never from a file.
