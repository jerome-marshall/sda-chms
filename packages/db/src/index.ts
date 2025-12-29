import { env } from "@sda-chms/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

// biome-ignore lint/performance/noNamespaceImport: <import schema>
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });
