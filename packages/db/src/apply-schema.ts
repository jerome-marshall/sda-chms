import { Pool } from "pg";
import { generateSchemaStatements } from "./schema-sql";

/**
 * Applies the current Drizzle schema to the Postgres database at the given URL.
 * Provisions a throwaway Postgres (e.g. the CI E2E service container) straight
 * from the schema — no migration replay needed. Assumes an empty database.
 */
export async function applySchema(connectionString: string): Promise<number> {
  const pool = new Pool({ connectionString });
  try {
    const statements = await generateSchemaStatements();
    for (const statement of statements) {
      await pool.query(statement);
    }
    return statements.length;
  } finally {
    await pool.end();
  }
}

// Run directly: `bun run src/apply-schema.ts` (reads DATABASE_URL).
if (import.meta.main) {
  const url = process.env.DATABASE_URL;
  if (url) {
    applySchema(url)
      .then((count) => {
        console.log(`Applied ${count} schema statements.`);
        process.exit(0);
      })
      .catch((error) => {
        console.error("Failed to apply schema:", error);
        process.exit(1);
      });
  } else {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
}
