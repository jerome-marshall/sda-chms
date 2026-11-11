# Database conventions

Read this before you change `apps/chms/src/db`, a migration, or a query.

Cloudflare D1 is SQLite. Drizzle is the only query layer. Schemas, migrations, and seed data live in `apps/chms/src/db`.

## Schema files

- One file per domain in `src/db/schema/`, re-exported through `src/db/schema.ts`. Import tables through `@schema`.
- Column helpers come from `void/schema-d1`. Relations come from `drizzle-orm`.
- Reuse the helpers at the top of `schema/people.ts`:
  - `uuidPk` for a TEXT primary key with a client-generated v4 UUID, because D1 has no server-side UUID default.
  - `createdAt` and `updatedAt` for integer milliseconds with client defaults, because D1 has no `now()`.
  - `isoDate` for a `YYYY-MM-DD` TEXT column.
  - `booleanCol` for an integer 0/1 column through Drizzle's boolean mode.

## Naming

- Columns use snake case in the string argument: `text("first_name")`.
- TypeScript fields use camel case.
- Tables use plural snake case: `people`, `people_departments`.
- Enum values are snake case strings in a `text` column with `{ enum: *_VALUES }`.

## Standard columns

Every table has `id`. A table with mutable rows also has `createdAt` and `updatedAt`. A join table or an append-only link has `createdAt` only. A table that supports soft delete also has `isActive`.

## Enums

- `*_VALUES` in `packages/shared/src/constants/` is the single source of truth.
- Use `text("column", { enum: VALUES }).notNull()`.
- SQLite has no native enum. The array constrains TypeScript and the generated CHECK constraint constrains the database.

## Unique constraints

SQLite rejects expressions in a table-level unique constraint, and it treats NULLs as distinct. To make name plus date of birth unique when either part is absent, store the coalesced value in a generated column and put a plain `uniqueIndex` over real columns. `schema/people.ts` does this with `identity_last_name`, `identity_date_of_birth`, and `unique_person_identity`.

A violation of that index reaches the API as a 409 with the constraint name. Do not add an app-level duplicate check.

## Zod schemas

- Generate database-level schemas with `createSelectSchema` and `createInsertSchema` from `void/drizzle-zod`.
- Export the schema and its inferred type. Name them `*SelectSchemaDb`, `*InsertSchemaDb`, `*SelectDb`, `*InsertDb`.
- Form and API schemas belong in `@sda-chms/shared/schema`, not here.

## Writes

- Never call `db.transaction()`. Drizzle issues raw `BEGIN` and `COMMIT`, which remote D1 rejects.
- A multi-write operation reads, computes every write in memory, then runs one `db.batch([...])`.
- Build batch statements with the lazy `*Stmt` helpers in `server/`. Pass `db` as the first argument.

## Migrations

- Never hand-write SQL. Run `void db generate` from `apps/chms`, then commit the generated files.
- The drift gate is `void db generate` followed by `git diff --exit-code -- apps/chms/src/db`. CI fails if a schema change has no regenerated migration.
- `void db status` reports applied and pending migrations. It does not compare the schema.
- `pnpm db:seed` resets local D1, applies migrations, and runs `src/db/seed.ts`. Treat any seed command as destructive.
- Local data lives in `apps/chms/.void/`, which is gitignored. `void db reset` clears it, `void db execute "<sql>"` inspects it.

## Avoid

- snake case for TypeScript fields.
- a table without `id`, or a mutable table without `createdAt` and `updatedAt`.
- enum values defined inline instead of imported.
- form validation in the schema folder.
- raw SQL instead of Drizzle.
- a server-side UUID or timestamp default.
