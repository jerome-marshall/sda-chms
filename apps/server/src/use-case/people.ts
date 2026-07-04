import { createTransaction } from "@sda-chms/db";
import { HOUSEHOLD_ROLE } from "@sda-chms/shared/constants/people";
import type {
  PersonInsertForm,
  PersonUpdateForm,
} from "@sda-chms/shared/schema/people";
import {
  getAllHouseholds,
  getAllPeopleWithHousehold,
  getPersonById,
  getPersonWithHouseholdById,
  insertHousehold,
  insertPerson,
  updateHousehold,
  updatePerson,
} from "../data-access/people";
import {
  householdContactFromForm,
  NULL_PERSON_CONTACT,
  peopleWithHouseholdDbToApi,
  personApiToDb,
  personDbToApi,
  personUpdateApiToDb,
  personWithHouseholdDbToApi,
} from "../transformers/people";

/** Returns all people with their Household's shared contact fields for the people list view. */
export const getAllPeopleWithHouseholdUseCase = async () => {
  const people = await getAllPeopleWithHousehold();
  return peopleWithHouseholdDbToApi(people);
};

/** Returns a single person without household head fallback (used internally). */
export const getPersonByIdUseCase = async (id: string) => {
  const person = await getPersonById(id);
  if (!person) {
    throw new Error("Person not found");
  }

  return personDbToApi(person);
};

/** Retrieves a person by ID with their Household's shared contact fields for the effective-value rule. */
export const getPersonWithHouseholdByIdUseCase = async (id: string) => {
  const person = await getPersonWithHouseholdById(id);
  if (!person) {
    throw new Error("Person not found");
  }

  return personWithHouseholdDbToApi(person);
};

/**
 * Creates a new person. If the person is a head-of-household, a new household is
 * created in the same transaction and linked automatically.
 */
export const addPersonUseCase = async (data: PersonInsertForm) => {
  const personData = personApiToDb(data);

  const personFinal = await createTransaction(async (trx) => {
    if (!data.householdId && data.householdRole !== "head") {
      throw new Error("Only Head of Household can create a household");
    }

    if (!data.householdId) {
      // The head defines the household: their contact details seed the
      // Household's shared values and are cleared on the person, who then
      // inherits them (no duplication — ADR-0001).
      const household = await insertHousehold(
        { familyName: data.familyName, ...householdContactFromForm(data) },
        trx
      );
      if (!household) {
        throw new Error("Failed to create household");
      }
      return insertPerson(
        { ...personData, ...NULL_PERSON_CONTACT, householdId: household.id },
        trx
      );
    }

    return insertPerson(personData, trx);
  });

  if (!personFinal) {
    throw new Error("Failed to create person");
  }

  return personDbToApi(personFinal);
};

/**
 * Updates an existing person. Applies the same household rules as addPersonUseCase:
 * heads without a household get a new one created automatically.
 */
export const updatePersonUseCase = async (
  id: string,
  data: PersonUpdateForm
) => {
  const personData = personUpdateApiToDb(data);

  await createTransaction(async (trx) => {
    if (!data.householdId && data.householdRole !== "head") {
      throw new Error("Only Head of Household can create a household");
    }

    if (!data.householdId) {
      const household = await insertHousehold(
        { familyName: data.familyName, ...householdContactFromForm(data) },
        trx
      );
      if (!household) {
        throw new Error("Failed to create household");
      }
      await updatePerson(
        id,
        { ...personData, ...NULL_PERSON_CONTACT, householdId: household.id },
        trx
      );
      return;
    }

    // A head editing their own household updates the shared family name and
    // contact details on the Household; their own contact columns stay cleared
    // so they keep inheriting the shared values (ADR-0001).
    if (data.householdRole === "head") {
      await updatePerson(id, { ...personData, ...NULL_PERSON_CONTACT }, trx);
      await updateHousehold(
        data.householdId,
        { familyName: data.familyName, ...householdContactFromForm(data) },
        trx
      );
    } else {
      await updatePerson(id, personData, trx);
    }
  });

  const updated = await getPersonWithHouseholdById(id);
  if (!updated) {
    throw new Error("Person not found");
  }

  return personWithHouseholdDbToApi(updated);
};

/**
 * Returns all households with head/member separation and a display name. The
 * name is the household's stored `familyName` when set; households with none
 * yet (legacy rows awaiting backfill) fall back to a head-derived
 * "{head.firstName} {head.lastName} Family" label.
 */
export const getAllHouseholdUseCase = async () => {
  const householdsData = await getAllHouseholds();
  const households = householdsData.map((household) => {
    const head = household.members.find(
      (member) => member.householdRole === HOUSEHOLD_ROLE.HEAD
    );
    const members = household.members.filter(
      (member) => member.householdRole !== HOUSEHOLD_ROLE.HEAD
    );

    const derivedName = `${head?.firstName} ${head?.lastName || ""} Family`
      .replace(/\s+/g, " ")
      .trim();

    return {
      ...household,
      head,
      members,
      name: household.familyName?.trim() || derivedName,
    };
  });

  return households;
};
