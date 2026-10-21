# Environment

The app needs no server variables. Local D1 is provisioned by Void itself —
there is no connection string. If `apps/chms/.env` exists from the Postgres
era, delete it (a stale `DATABASE_URL` there no longer does anything).

## Local setup

No database service to start. From the repo root, run in order:

```bash
pnpm db:migrate    # apply migrations to local D1 (stored under apps/chms/.void/)
pnpm db:seed       # optional faker data (local file only; nothing remote to wipe)
pnpm dev           # start the app on :3001
```

Seeding resets the local database first, so only ever run it where losing
the local data is fine — and only ever seed through `pnpm db:seed`.

## CI

CI needs no database service either: migrations apply to a throwaway local
D1 before the test run (see `.github/workflows/test.yml`).
