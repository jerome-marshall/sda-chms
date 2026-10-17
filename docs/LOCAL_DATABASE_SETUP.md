# Local Database Setup

This guide walks you through setting up a local PostgreSQL database for development.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running

## Quick Start

The database starts automatically when you run the dev command:

```bash
pnpm dev
```

### Manual Database Control

To start the database manually:

```bash
pnpm db:start
```

To stop the database:

```bash
pnpm db:stop
```

This will start a PostgreSQL 17.2 container with:

| Setting             | Value         |
| ------------------- | ------------- |
| Container Name      | `sda-chms-db` |
| PostgreSQL User     | `postgres`    |
| PostgreSQL Password | `password`    |
| Database Name       | `sda_chms`    |
| Port                | `5432`        |

### Using Docker Run (Alternative)

If you prefer not to use Docker Compose:

```bash
docker run -d \
  --name sda-chms-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=sda_chms \
  -p 5432:5432 \
  -v sda-chms-postgres-data:/var/lib/postgresql/data \
  postgres:17.7
```

## Environment Configuration

Create `apps/web/.env` (see `apps/web/ENV.md` — Void reads only that file
and rejects `.env.example`):

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/sda_chms
```

## Database Commands

### Start the database

```bash
docker compose up -d
```

### Stop the database

```bash
docker compose down
```

### Stop and remove all data

```bash
docker compose down -v
```

### View database logs

```bash
docker compose logs -f postgres
```

### Connect to the database via CLI

```bash
docker exec -it sda-chms-db psql -U postgres -d sda_chms
```

## Running Migrations

After starting the database, apply the migration history with Void (run
from `apps/web`, with `apps/web/.env` in place):

```bash
pnpm --dir apps/web exec void db migrate
```

To seed faker data into the throwaway database:

```bash
pnpm --dir apps/web exec void db seed --yes
```

`void db seed --yes` wipes every object in `public` first — only ever run
it against a throwaway database (local container or the CI service
container).

## Troubleshooting

### Port 5432 already in use

If you have a local PostgreSQL installation, stop it first or change the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432" # Use port 5433 instead
```

Then update your `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/sda_chms
```

### Container won't start

Check if an old container exists:

```bash
docker rm -f sda-chms-db
docker compose up -d
```

### Reset the database

To completely reset the database:

```bash
docker compose down -v
docker compose up -d
```

## Connecting with a GUI Client

You can connect to the database using any PostgreSQL client (e.g., TablePlus, pgAdmin, DBeaver):

| Field    | Value       |
| -------- | ----------- |
| Host     | `localhost` |
| Port     | `5432`      |
| User     | `postgres`  |
| Password | `password`  |
| Database | `sda_chms`  |
