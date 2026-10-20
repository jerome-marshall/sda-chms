---
status: accepted
---

# Cloudflare D1 is the database

The app stores its data in Cloudflare D1, reached through `void/db`. Void provisions the local database and binds the deployed one, so there is no connection string and no database service in local development or CI.

## Why

The app already runs as a Void worker. A D1 binding is part of that runtime, so the database travels with the app instead of sitting behind a connection pool the worker cannot hold. Local development follows the same path: `void db migrate` writes a SQLite file under `apps/chms/.void/`, and the dev server reads it through the same binding. Nothing needs Docker or a hosted database to boot the app.

## Considered options

- **Keep Postgres on Neon (status quo).** Rejected. It keeps a TCP connection and a secret in a runtime that has neither, and every local start needs a service.
- **Postgres through Hyperdrive.** Rejected for this app. It adds a Cloudflare resource and its own configuration to reach a database the schema can express in SQLite.
- **PGlite inside the worker.** Rejected. It is a test and prototype tool, not the production binding, so local and deployed behavior would diverge.
- **D1 through `void/db` (chosen).** The binding is native to the runtime, local data is a file, and the Drizzle schema generates the migrations Void applies.

## Consequences

- The schema uses SQLite types and helpers from `void/schema-d1`. UUID primary keys are TEXT with a client-generated v4 UUID, timestamps are integer milliseconds with client defaults, dates are ISO `YYYY-MM-DD` TEXT, and booleans are integer 0/1 through Drizzle's boolean mode.
- D1 has no interactive transactions. `db.transaction()` issues raw `BEGIN`/`COMMIT`, which remote D1 rejects. A multi-write operation reads first, computes every write in memory, then runs one `getDb().batch([...])`, which is one SQL transaction.
- A unique constraint over nullable columns needs stored generated columns. SQLite treats NULLs as distinct and rejects expressions inside a table-level unique constraint. `identity_last_name` and `identity_date_of_birth` materialize the coalesce, and `unique_person_identity` indexes the real columns.
- Migrations are generated, not hand-written. CI runs `void db generate` and fails on a diff under `apps/chms/src/db`.
- Remote D1 is the open risk. The `BEGIN` rejection and the remote error strings were read from source, not observed against a deployed database. A staging D1 check settles it.
