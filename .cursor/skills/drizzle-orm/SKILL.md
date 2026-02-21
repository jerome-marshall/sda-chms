---
name: drizzle-orm
description: Type-safe SQL ORM for TypeScript with zero runtime overhead. Use when working with Drizzle ORM, defining database schemas, writing queries, handling migrations, or optimizing database performance in TypeScript projects.
---

# Drizzle ORM

Modern TypeScript-first ORM with compile-time type safety and SQL-like syntax. Zero dependencies, optimized for edge and serverless runtimes.

## Basic Setup

```typescript
// db/schema.ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

// db/client.ts
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

## CRUD

```typescript
import { eq } from "drizzle-orm"

// Insert
const newUser = await db
  .insert(users)
  .values({ email: "user@example.com", name: "John" })
  .returning()

// Select
const allUsers = await db.select().from(users)
const user = await db.select().from(users).where(eq(users.id, 1))

// Update
await db.update(users).set({ name: "Jane" }).where(eq(users.id, 1))

// Delete
await db.delete(users).where(eq(users.id, 1))
```

## Schema Patterns

```typescript
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  json,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core"

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    role: text("role", { enum: ["admin", "user", "guest"] }).default("user"),
    metadata: json("metadata").$type<{ theme: string; locale: string }>(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: unique("email_unique_idx").on(table.email),
  }),
)

// Infer TypeScript types
type User = typeof users.$inferSelect
type NewUser = typeof users.$inferInsert
```

## Relations

```typescript
import { relations } from "drizzle-orm"

// One-to-many
export const authorsRelations = relations(authors, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(authors, { fields: [posts.authorId], references: [authors.id] }),
}))

// Query with relations
const authorsWithPosts = await db.query.authors.findMany({
  with: { posts: true },
})

// Many-to-many — use a join table with composite primary key
export const usersToGroups = pgTable(
  "users_to_groups",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.groupId] }),
  }),
)
```

## Filtering & Sorting

```typescript
import {
  eq,
  gt,
  like,
  and,
  or,
  inArray,
  isNull,
  desc,
  asc,
  between,
} from "drizzle-orm"

await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.role, "admin"),
      gt(users.createdAt, new Date("2024-01-01")),
      isNull(users.deletedAt),
    ),
  )

await db
  .select()
  .from(users)
  .orderBy(desc(users.createdAt))
  .limit(10)
  .offset(20)
```

## Joins

```typescript
import { count } from "drizzle-orm"

// Inner join
const result = await db
  .select({ user: users, post: posts })
  .from(users)
  .innerJoin(posts, eq(users.id, posts.authorId))

// With aggregation
const result = await db
  .select({ name: authors.name, postCount: count(posts.id) })
  .from(authors)
  .leftJoin(posts, eq(authors.id, posts.authorId))
  .groupBy(authors.id)
```

## Transactions

```typescript
// Auto-rollback on error
await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values({ ... }).returning();
  await tx.insert(posts).values({ authorId: user.id, title: '...' });
});
```

## Migrations (Drizzle Kit)

```typescript
// drizzle.config.ts
import type { Config } from "drizzle-kit"

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config
```

```bash
npx drizzle-kit generate   # generate migration SQL
npx drizzle-kit migrate    # apply migrations
npx drizzle-kit studio     # open database GUI
npx drizzle-kit introspect # generate schema from existing DB
```

## Red Flags

- Using `any`/`unknown` for JSON columns without `.$type<>()` annotation
- Building raw SQL strings instead of using the `sql` template tag (SQL injection risk)
- Multi-step data changes without a transaction
- `select()` without column selection on large tables
- Missing indexes on foreign keys or frequently filtered columns
- Unbounded queries (no `limit`) in production

## References

Load these only when needed:

- [Advanced Schemas](./references/advanced-schemas.md) — custom types, composite keys, indexes, multi-tenant patterns
- [Query Patterns](./references/query-patterns.md) — subqueries, CTEs, raw SQL, prepared statements, batch ops
- [Performance](./references/performance.md) — connection pooling, N+1 prevention, edge runtime integration
- [vs Prisma](./references/vs-prisma.md) — feature comparison, migration guide, when to choose Drizzle
