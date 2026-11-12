import type { QueryDatabase } from "./db";

/** Fetches all groups (church small groups, committees, etc.). */
export const getAllGroups = (db: QueryDatabase) =>
  db.query.groupsTable.findMany();
