import { db } from "@sda-chms/db";
import { withDbErrorHandling } from "src/lib/errors";

export const getAllGroups = () =>
  withDbErrorHandling(async () => {
    const groups = await db.query.groupsTable.findMany();
    return groups;
  }, "getAllGroups");
