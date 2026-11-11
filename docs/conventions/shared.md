# Shared package conventions

Read this before you change `packages/shared`.

The web app, the API, and the planned Expo app all use this package. It holds validation schemas, constants, types, and pure helpers. It depends on nothing in the app.

## Structure

```
src/schema/      Zod schemas for forms and API requests
src/constants/   enum value arrays and select options
src/types/       shared TypeScript types
src/utils/       pure helpers and transformers
```

## Schemas

- One file per domain, for example `people.ts`.
- Export the schema and `z.infer<typeof schema>` together.
- Use `.refine()` for cross-field rules. Put the message on the field.
- These are form and API schemas. Database schemas live in `apps/chms/src/db`.

## Constants

- One file per domain.
- Export `*_VALUES` as a const tuple. Drizzle columns and Zod schemas both read it.
- Export `*_OPTIONS` as label and value pairs for selects.
- This is the single source of truth for every enum-like value.

## Types

- Only types that cross a package boundary. `ApiErrorBody` is the example.
- Keep them minimal.

## Utils

- Pure functions with no app dependency. Transformers and formatters belong here.
- Test the rule in `packages/shared` when the rule is pure.

## Imports

Consumers import by subpath.

```ts
import { HOUSEHOLD_ROLE } from "@sda-chms/shared/constants/people";
import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
```

## Avoid

- App-specific logic.
- Imports from `@schema`, `@/`, or `void/*`.
- Node built-ins, DOM types, or React types. The Expo app consumes this package too, per ADR-0006.
- Duplicated database schemas.
- UI components or route logic.
