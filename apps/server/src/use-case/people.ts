import { createTransaction } from "@sda-chms/db";
import { HOUSEHOLD_ROLE } from "@sda-chms/shared/constants/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import {
  getAllHouseholds,
  getAllPeopleWithHead,
  getPersonById,
  getPersonWithHeadById,
  insertHousehold,
  insertPerson,
} from "../data-access/people";
import {
  peopleWithHeadDbToApi,
  personApiToDb,
  personDbToApi,
  personWithHeadDbToApi,
} from "../transformers/people";

/** Returns all people with household head fallback fields for the people list view. */
export const getAllPeopleWithHeadUseCase = async () => {
  const people = await getAllPeopleWithHead();
  return peopleWithHeadDbToApi(people);
};

/** Returns a single person without household head fallback (used internally). */
export const getPersonByIdUseCase = async (id: string) => {
  const person = await getPersonById(id);
  if (!person) {
    throw new Error("Person not found");
  }

  return personDbToApi(person);
};

/** Retrieves a person by ID with household head data for the contact fallback. */
export const getPersonWithHeadByIdUseCase = async (id: string) => {
  const person = await getPersonWithHeadById(id);
  if (!person) {
    throw new Error("Person not found");
  }

  return personWithHeadDbToApi(person);
};

/**
 * Creates a new person. If the person is a head-of-household, a new household is
 * created in the same transaction and linked automatically.
 */
export const addPersonUseCase = async (data: PersonInsertForm) => {
  const personData = personApiToDb(data);

  const personFinal = await createTransaction(async (trx) => {
    if (!data.householdId) {
      // If no household ID, check if the person is a head of household
      if (data.householdRole === "head") {
        // If the person is a head of household, create a household
        const household = await insertHousehold(trx);

        if (!household) {
          throw new Error("Failed to create household");
        }

        const person = await insertPerson(
          {
            ...personData,
            householdId: household.id,
          },
          trx
        );
        return person;
      }

      throw new Error("Only Head of Household can create a household");
    }

    const person = await insertPerson(personData, trx);
    return person;
  });

  if (!personFinal) {
    throw new Error("Failed to create person");
  }

  return personDbToApi(personFinal);
};

/** Returns all households with head/member separation and a derived household name ("{head.firstName} {head.lastName} Family"). */
export const getAllHouseholdUseCase = async () => {
  const householdsData = await getAllHouseholds();
  const households = householdsData.map((household) => {
    const head = household.members.find(
      (member) => member.householdRole === HOUSEHOLD_ROLE.HEAD
    );
    const members = household.members.filter(
      (member) => member.householdRole !== HOUSEHOLD_ROLE.HEAD
    );

    return {
      ...household,
      head,
      members,
      name: `${head?.firstName} ${head?.lastName || ""} Family`,
    };
  });

  return households;
};
