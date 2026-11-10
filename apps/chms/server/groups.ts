import type { Database } from "./db";

/** Fetches all groups (church small groups, committees, etc.). */
export const getAllGroups = (db: Database) => db.query.groupsTable.findMany();
