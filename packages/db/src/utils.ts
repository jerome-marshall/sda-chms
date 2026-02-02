import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { db } from ".";
import type * as schema from "./schema";

export type Transaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export function createTransaction<T>(
  cb: (trx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(cb);
}
