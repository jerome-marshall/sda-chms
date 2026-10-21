import { getDb } from "./db";

/** Fetches all groups (church small groups, committees, etc.). */
export const getAllGroups = () => getDb().query.groupsTable.findMany();
