# Local Database Setup

This guide walks you through setting up the local database for development.
The app runs on Cloudflare D1 through Void — a local SQLite file, so there
is no container to start and no connection string to configure.

## Quick Start

Run, in order:

```bash
pnpm db:migrate    # apply migrations to local D1 (stored under apps/chms/.void/)
pnpm db:seed       # optional faker data (local file only; resets it first)
pnpm dev           # start the app on :3001
```

`pnpm dev` does not migrate or seed. Run those first.

## Where the data lives

The dev server and local `void db` commands share one database file under
`apps/chms/.void/` (gitignored). To start over, reset it with:

```bash
pnpm --dir apps/chms exec void db reset
```

then `pnpm db:migrate` and optionally `pnpm db:seed`.

## Environment Configuration

None. Void provisions the local D1 binding itself. If `apps/chms/.env`
exists from the Postgres era, delete it — see `apps/chms/ENV.md`.

## Database Commands

### Apply migrations

```bash
pnpm db:migrate
```

### Seed faker data

```bash
pnpm db:seed
```

Override the row count with `SEED_COUNT` (default 100):

```bash
SEED_COUNT=20 pnpm db:seed
```

Seeding resets the local database first. Only ever run it where losing the
local data is fine, and only ever through `pnpm db:seed`.

### Import the operator CSV

Start the dev server, then run the thin import client against its
development-only import route:

```bash
pnpm dev
pnpm --dir apps/chms run import-people -- "<csv-path>" [base-url]
```

The base URL defaults to `http://localhost:3001` (`CHMS_URL` overrides).

## Inspecting the data

Run SQL against local D1 with Void:

```bash
pnpm --dir apps/chms exec void db execute "select count(*) from people"
```

or open Drizzle Studio:

```bash
pnpm --dir apps/chms exec void db studio
```
