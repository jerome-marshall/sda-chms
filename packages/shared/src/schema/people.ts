import { peopleInsertSchemaDb } from "@sda-chms/db/schema/people";
import type z from "zod";

export const personInsertSchema = peopleInsertSchemaDb.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type PersonInsert = z.infer<typeof personInsertSchema>;
