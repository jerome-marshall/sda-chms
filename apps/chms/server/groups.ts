import { getDb } from "./db";
import type { Database } from "./db";

/** Fetches all groups (church small groups, committees, etc.). */
export const getAllGroups = (db: Database = getDb()) =>
  db.query.groupsTable.findMany();
