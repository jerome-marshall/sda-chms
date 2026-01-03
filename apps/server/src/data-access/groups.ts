import { db } from "@sda-chms/db";

export const getAllGroups = async () => {
  const groups = await db.query.groupsTable.findMany();
  return groups;
};
