# Environment

The app declares no required server variables. D1 needs no connection string: Void provisions the local binding and binds the deployed database itself. Declarations live in `src/env.ts`, which exports `defineEnv({})`; add a variable there before you read it in server code so Void can type it and check it.

## Local overrides

`apps/chms/.env` is optional and gitignored. Use it for local overrides that `src/env.ts` declares. If the file exists from the Postgres era, delete it. A stale `DATABASE_URL` no longer does anything.

Check the local file against the declarations:

```bash
pnpm --dir apps/chms exec void env check
```

The command exits 0 when every value in `.env` is valid for the declared schema. CI runs it after `void prepare`.

## Local database

No service to start. See the README's [local database section](../README.md#local-database) for the migrate, seed, reset, and inspect commands.

## CI

CI needs no database service. Migrations apply to a throwaway local D1 before the test run, and `void env check` verifies the declarations (see `.github/workflows/test.yml`).
