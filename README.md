# sda-chms

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Hono, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **Node.js** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Vite+** - Unified toolchain (dev, build, test, lint, format, tasks)

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM, managed through Void.

1. Make sure you have a PostgreSQL database set up (see `docs/LOCAL_DATABASE_SETUP.md`).
2. Create `apps/web/.env` with your connection details (see `apps/web/ENV.md`):

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/sda_chms
```

3. Apply the migration history:

```bash
pnpm db:migrate
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser. The SPA and the API (`/api/*`) are served from the single Void dev server on that origin.

## Project Structure

```
sda-chms/
├── apps/
│   └── web/         # Void app: React SPA (src/) + API file routes (routes/api/) + Drizzle schema (db/)
├── packages/
│   ├── shared/      # Zod schemas, constants, types, utils
│   └── config/      # Shared TypeScript config
```

## Available Scripts

- `pnpm dev`: Start the Void dev server (SPA + API on :3001)
- `pnpm build`: Build all applications
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm db:migrate`: Apply pending migrations through `void db`
- `pnpm check`: Run `vp check --fix` (format, lint, type check)
