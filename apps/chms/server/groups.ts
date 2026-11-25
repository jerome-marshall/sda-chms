import type { QueryDatabase } from "./db";

export const getAllGroups = (db: QueryDatabase) =>
  db.query.groupsTable.findMany();
