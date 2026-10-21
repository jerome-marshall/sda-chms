import { householdsTable } from "@schema";
import type { HouseholdsInsertDb } from "@schema";
import { HOUSEHOLD_ROLE } from "@sda-chms/shared/constants/people";
import { eq } from "void/db";

import { getDb } from "./db";

/** The Household's stored fields set on create/update: the family name plus the shared contact details (ADR-0001). */
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
 * Lazy household insert used inside a batch; the caller supplies the id up
 * front (client-generated) so no write depends on another write's result.
 * The caller reads row [0] of its result.
 */
export const insertHouseholdStmt = (data: HouseholdsInsertDb) =>
  getDb().insert(householdsTable).values(data).returning();

/** Lazy household update used inside a batch. */
export const updateHouseholdStmt = (
  id: string,
  data: HouseholdWritableFields
) =>
  getDb()
    .update(householdsTable)
    .set(data)
    .where(eq(householdsTable.id, id))
    .returning();

/** Fetches all households with their member list (used to build the household selector on the add-person form). */
const getAllHouseholdRows = () =>
  getDb().query.householdsTable.findMany({
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

/**
 * Returns all households with head/member separation and a display name. The
 * name is the household's stored `familyName` when set; households with none
 * yet (legacy rows awaiting backfill) fall back to a head-derived
 * "{head.firstName} {head.lastName} Family" label.
 */
export const getAllHouseholds = async () => {
  const householdsData = await getAllHouseholdRows();
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
