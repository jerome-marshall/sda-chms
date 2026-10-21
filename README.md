# sda-chms

A church management system for a Seventh-day Adventist congregation. It tracks people, the households they belong to, and the relationships between them.

One Void app in `apps/chms` serves rendered pages and the JSON API (`/api/*`) from a single origin. Data lives in Cloudflare D1, accessed through Drizzle ORM. Node is only the toolchain host; the app runs on a Workers-style runtime.

## Features

- **Void** — one worker serves the pages and the API, with typed file routes and route loaders
- **React 19** — the page layer, rendered on the server and hydrated in the browser
- **D1** — the database, provisioned locally by Void and bound in production
- **Drizzle** — the ORM, with migrations generated from the schema
- **Hono** — the HTTP layer under Void's file-route dispatch
- **Tailwind CSS v4 + shadcn/ui** — the component and styling layer
- **Vite+** — the toolchain for dev, build, test, lint, and format

## Getting started

Install dependencies:

```bash
pnpm install
```

Prepare migrations on the local D1 database and seed sample data:

```bash
pnpm db:migrate
pnpm db:seed
```

Start the app:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001). The pages and the API share that origin.

## Local database

No database service and no connection string. Void provisions a local D1 database as a file under `apps/chms/.void/`, which is gitignored. The dev server and the `void db` commands read the same file.

Use these commands from the repo root:

```bash
pnpm db:migrate    # apply pending migrations
pnpm db:generate   # regenerate migrations from the schema; CI fails on drift
pnpm db:seed       # reset the local database, migrate, then seed faker rows
```

`pnpm db:seed` is destructive. It resets the local database first, so run it only where losing local data is fine. Set `SEED_COUNT` to change the row count (default 100):

```bash
SEED_COUNT=20 pnpm db:seed
```

To start over, reset the database. The reset clears the file and applies the migrations again:

```bash
pnpm --dir apps/chms exec void db reset
pnpm db:seed
```

Inspect the data with SQL or Drizzle Studio:

```bash
pnpm --dir apps/chms exec void db execute "select count(*) from people"
pnpm --dir apps/chms exec void db studio
```

To import the operator's member CSV, start the dev server and run the import client. It POSTs the file to the development-only import route:

```bash
pnpm dev
pnpm --dir apps/chms run import-people -- "<csv-path>" [base-url]
```

The base URL defaults to `http://localhost:3001`; `CHMS_URL` overrides it.

## Project structure

```
sda-chms/
├── apps/
│   └── chms/
│       ├── src/
│       │   ├── pages/          # Void pages: index.tsx + index.server.ts (loader/action)
│       │   ├── routes/api/     # the JSON API, one file per URL shape
│       │   ├── db/             # Drizzle schema, migrations, and seed
│       │   ├── middleware/     # API error contract
│       │   ├── components/     # React components
│       │   ├── lib/            # client helpers
│       │   └── env.ts          # environment declarations
│       ├── server/             # one module per domain, D1 access
│       └── void.config.ts      # sourceDir, head, routing headers, worker settings
├── packages/
│   └── shared/                 # Zod schemas, constants, types, pure helpers
└── docs/
    ├── adr/                    # architecture decisions
    └── agents/                 # how agents work in this repo
```

The API under `/api/*` is the single data contract. Page loaders and actions call it with `fetch` from `void/client`, which runs in-process during SSR. The planned Expo app will call the same routes, so no page imports a server module to read data.

## Scripts

- `pnpm dev`: start the Void dev server (pages + API on :3001)
- `pnpm build`: build the worker into `apps/chms/dist/ssr`
- `pnpm test`: run the Vitest suite through `vp` (`pnpm test:watch` for watch mode)
- `pnpm check-types`: check TypeScript types across all packages
- `pnpm check`: run `vp check --fix` (format, lint, type check)
- `pnpm db:migrate`, `pnpm db:generate`, `pnpm db:seed`: database commands above
- `pnpm test:e2e`: run Playwright against the built worker on local D1
- `vp run verify`: run the CI-equivalent gate chain locally

## Environment and security

The app declares no required server variables, and D1 needs no connection string. Local overrides go in `apps/chms/.env`; see `apps/chms/ENV.md` and `apps/chms/src/env.ts`. Check the declarations with:

```bash
pnpm --dir apps/chms exec void env check
```

Security headers (`x-content-type-options`, `x-frame-options`, `referrer-policy`) are set through `routing.headers` in `apps/chms/void.config.ts`. Void's worker middleware applies them to page and API responses in dev and in the production build.

## Documentation

- `CONTEXT.md` defines the domain vocabulary
- `docs/adr/` records the architecture decisions
- `.cursor/rules/` holds the conventions agents and contributors follow
- `apps/chms/ENV.md` covers environment declarations
