import { db } from "@sda-chms/db";
import { withDbErrorHandling } from "../lib/errors";

/** Fetches all groups (church small groups, committees, etc.). */
export const getAllGroups = () =>
  withDbErrorHandling(async () => {
    const groups = await db.query.groupsTable.findMany();
    return groups;
  }, "getAllGroups");
