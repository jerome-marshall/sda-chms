import { env } from "@sda-chms/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

// biome-ignore lint/performance/noNamespaceImport: <import schema>
import * as schema from "./schema";
import type { Transaction } from "./utils";

export const db = drizzle(env.DATABASE_URL, { schema });

// biome-ignore lint/performance/noBarrelFile: <required here>
export { eq, sql } from "drizzle-orm";
export { createTransaction } from "./utils";

export type DbTransaction = typeof db | Transaction;
