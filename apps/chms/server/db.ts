import { db } from "void/db";

/**
 * The application's Drizzle database type. `void/db` provides it
 * (request-scoped D1 session in production, the SQLite stand-in under
 * Vitest); this module names it once for every signature.
 *
 * D1 has no interactive transactions — Drizzle's `db.transaction()` issues
 * raw BEGIN/COMMIT, which remote D1 rejects. Multi-write domain operations
 * issue one `getDb().batch([...])` instead: reads first, every write
 * computed in memory, then a single batch of unexecuted query builders.
 */
export type Database = typeof db;

/**
 * Returns the active database. In production this is Void's request-scoped
 * D1 instance; in tests it is the SQLite stand-in the `void/db` alias
 * provides.
 */
export const getDb = (): Database => db;
