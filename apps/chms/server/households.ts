import { householdsTable } from "@schema";
import type { HouseholdsInsertDb } from "@schema";
import { HOUSEHOLD_ROLE } from "@sda-chms/shared/constants/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { eq } from "void/db";

import type { QueryDatabase, WriteDatabase } from "./db";

type HouseholdWritableFields = Partial<
  Pick<
    HouseholdsInsertDb,
    | "familyName"
    | "addressLine1"
    | "addressLine2"
    | "city"
    | "state"
    | "country"
    | "phone"
    | "preferredVisitingTime"
  >
>;

/**
 * The Household-owned fields a head enters through the Person form. ADR-0001
 * makes the Household the owner of the family name and shared contacts, so the
 * mapping lives here rather than in the Person module.
 */
export const householdWriteFields = (
  data: PersonInsertForm
): HouseholdWritableFields => ({
  familyName: data.familyName,
  addressLine1: data.addressLine1 || null,
  addressLine2: data.addressLine2 || null,
  city: data.city || null,
  state: data.state || null,
  country: data.country || null,
  phone: data.phone || null,
  preferredVisitingTime: data.preferredVisitingTime || null,
});

/**
 * Lazy household insert used inside a batch; the caller supplies the id up
 * front (client-generated) so no write depends on another write's result.
 * The caller reads row [0] of its result.
 */
export const insertHouseholdStmt = (
  db: WriteDatabase,
  data: HouseholdsInsertDb
) => db.insert(householdsTable).values(data).returning();

export const updateHouseholdStmt = (
  db: WriteDatabase,
  id: string,
  data: HouseholdWritableFields
) =>
  db
    .update(householdsTable)
    .set(data)
    .where(eq(householdsTable.id, id))
    .returning();

/**
 * The Household's stored Head: the member whose `householdRole` is Head, or
 * undefined when none is. The role is stored, so read it rather than treating
 * the first member of a list as the Head.
 */
export const getHouseholdHeadRow = (db: QueryDatabase, householdId: string) =>
  db.query.peopleTable.findFirst({
    where: (table, { and, eq: eqOp }) =>
      and(
        eqOp(table.householdId, householdId),
        eqOp(table.householdRole, HOUSEHOLD_ROLE.HEAD)
      ),
  });

const getAllHouseholdRows = (db: QueryDatabase) =>
  db.query.householdsTable.findMany({
    with: {
      members: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          country: true,
          householdRole: true,
        },
      },
    },
  });

export const getAllHouseholds = async (db: QueryDatabase) => {
  const householdsData = await getAllHouseholdRows(db);
  return householdsData.map((household) => {
    const head = household.members.find(
      (member) => member.householdRole === HOUSEHOLD_ROLE.HEAD
    );
    const members = household.members.filter(
      (member) => member.householdRole !== HOUSEHOLD_ROLE.HEAD
    );

    const derivedName = `${head?.firstName} ${head?.lastName || ""} Family`
      .replaceAll(/\s+/gu, " ")
      .trim();

    return {
      ...household,
      head,
      members,
      name: household.familyName?.trim() || derivedName,
    };
  });
};
