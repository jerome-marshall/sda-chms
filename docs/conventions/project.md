# Project conventions

Read this before you change the repo layout, a command, or a naming rule. For the domain itself, read `CONTEXT.md` and `docs/adr/`.

## Stack

sda-chms is a Vite+ monorepo on pnpm and TypeScript. One Void app runs on a Workers-style runtime and serves React 19 pages and file-based API routes from one origin. Drizzle talks to Cloudflare D1. Node is only the toolchain host.

```
apps/chms/            the Void app, React pages, API routes, schema and migrations, server modules
packages/shared/      Zod schemas, constants, types, pure helpers
docs/adr/             architecture decisions
docs/agents/          how to work in this repo
docs/conventions/     the rules for each area
```

## Commands

```bash
pnpm dev            # pages and API on :3001 against local D1
pnpm test           # unit and integration tests
pnpm test:watch     # fast loop
pnpm check-types    # tsc across the workspace
pnpm check          # lint, format, and types, with fixes
pnpm build          # build the worker into apps/chms/dist/ssr
pnpm verify         # the CI gate
pnpm verify:pr      # verify, then build and Playwright
pnpm db:migrate     # apply pending migrations locally
pnpm db:generate    # regenerate migrations from the schema
pnpm db:seed        # destructive: reset local D1, migrate, seed
```

Use pnpm. Never npm or yarn.

## Setup

Run `pnpm install`, then `pnpm db:migrate` and `pnpm db:seed`. The dev server and the `void db` commands read the same file under `apps/chms/.void/`, which is gitignored. There is no database service and no connection string.

`pnpm db:seed` resets the local database first. Run it only where losing local data is fine. `SEED_COUNT` changes the row count.

## Naming

- Files use kebab case: `add-person-form.tsx`, `use-data-grid.ts`.
- Void route files keep their routing names and brackets: `routes/api/people/[id].ts`, `pages/people/[id]/index.tsx`.
- TypeScript fields use camel case. Database columns use snake case in the string argument.
- One word per concept. Use the vocabulary in `CONTEXT.md`, including the terms it says to avoid.

## Imports

- `@/` maps to `apps/chms/src/`.
- `@schema` maps to `apps/chms/src/db/schema.ts`.
- `@sda-chms/shared/<dir>/<file>` for workspace code.
- Relative imports within an area. A route file reaches `server/` with the correct `../../..` depth.
- No barrel files, except `apps/chms/src/db/schema.ts`, which Void expects.

## The API is the contract

Pages read and write through `/api/*` with `fetch` from `void/client`. The call runs in-process during SSR and is typed by Void's generated `RouteMap`. The planned Expo app calls the same routes. A page never imports a server module to read data.

## Secrets

Never commit secrets, API keys, or `.env` files. Local overrides go in `apps/chms/.env`, which is gitignored.

## Documentation rules

- JSDoc on every exported function, class, type, and constant. One line is enough.
- Inline comments only for a non-obvious why.
- Do not narrate what the code already says.
- Do not reference tickets or pull requests in comments.
- Do not add file banners or section separators.

Update a convention file when behavior or a command changes. Do not update it for a refactor that changes neither.
