import { groupsTable } from "@schema";
import type { PeopleInsertDb, RelationshipsInsertDb } from "@schema";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { Effect } from "effect";

import { getPersonRowById, insertPerson } from "../../server/people";
import { insertRelationshipStmt } from "../../server/relationships";
import { validHead } from "../fixtures";
import { db } from "../void-db";

/**
 * The shared fixture stays untyped for the HTTP tests, which take `unknown`.
 * The service seam needs the schema's literal unions.
 */
export const headForm = validHead as PersonInsertForm;

/** Inserts one Person, so a service test starts from a known directory. */
export const seedPerson = (overrides: Partial<PeopleInsertDb> = {}) =>
  Effect.promise(() =>
    insertPerson(
      {
        firstName: "Jo",
        maritalStatus: "single",
        membershipStatus: "member",
        isActive: true,
        ...overrides,
      },
      db
    )
  );

type RelationshipSeed = Pick<
  RelationshipsInsertDb,
  "personId" | "relatedPersonId" | "type"
> &
  Partial<Pick<RelationshipsInsertDb, "state" | "createdAt">>;

/** Inserts one Relationship row without the service's Marital Status rewrite. */
export const seedRelationship = (data: RelationshipSeed) =>
  Effect.promise(async () => {
    const rows = await insertRelationshipStmt(db, {
      id: crypto.randomUUID(),
      ...data,
    });
    const created = rows[0];
    if (!created) {
      throw new Error("seedRelationship: insert returned no row");
    }
    return created;
  });

/** Reads a Person row straight from the database. */
export const readPerson = (id: string) =>
  Effect.promise(async () => {
    const person = await getPersonRowById(db, id);
    if (!person) {
      throw new Error(`readPerson: no Person with id ${id}`);
    }
    return person;
  });

/** Inserts one Group. */
export const seedGroup = (name: string) =>
  Effect.promise(() => db.insert(groupsTable).values({ name }).returning());
