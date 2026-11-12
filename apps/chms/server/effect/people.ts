import { HOUSEHOLD_ROLE } from "@sda-chms/shared/constants/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { Context, Effect, Layer } from "effect";

import {
  getHouseholdHeadRow,
  householdWriteFields,
  insertHouseholdStmt,
  updateHouseholdStmt,
} from "../households";
import {
  getAllPeopleWithHouseholdRows,
  getPersonRowById,
  getPersonWithHouseholdRowById,
  insertPerson,
  insertPersonStmt,
  NULL_PERSON_CONTACT,
  personApiToDb,
  personFormToDbFields,
  personWithHouseholdDbToApi,
  updatePersonStmt,
} from "../people";
import type { PersonWithHouseholdApi } from "../people";
import { Db, fromDb } from "./db";
import {
  HouseholdAlreadyHasHead,
  internalFailure,
  MaritalStatusConflict,
  PersonNotFound,
} from "./errors";
import type { InfraError, InvariantError } from "./errors";
import { MaritalStatus } from "./marital-status";

/** The People operations the API exposes. */
export interface PeopleService {
  readonly getAll: () => Effect.Effect<PersonWithHouseholdApi[], InfraError>;
  readonly getById: (
    id: string
  ) => Effect.Effect<PersonWithHouseholdApi, PersonNotFound | InfraError>;
  readonly add: (
    data: PersonInsertForm
  ) => Effect.Effect<
    PersonWithHouseholdApi,
    HouseholdAlreadyHasHead | InfraError | InvariantError
  >;
  readonly update: (
    id: string,
    data: PersonInsertForm
  ) => Effect.Effect<
    PersonWithHouseholdApi,
    | PersonNotFound
    | MaritalStatusConflict
    | HouseholdAlreadyHasHead
    | InfraError
  >;
}

/** People reads and writes behind Effect; each call uses the request's `Db`. */
export class People extends Context.Service<People, PeopleService>()(
  "People"
) {}

/** Builds the People service from the request-scoped database and spouse rules. */
export const PeopleLive = Layer.effect(
  People,
  Effect.gen(function* PeopleLive() {
    const db = yield* Db;
    const maritalStatus = yield* MaritalStatus;

    return {
      getAll: () =>
        fromDb(() => getAllPeopleWithHouseholdRows(db)).pipe(
          Effect.map((rows) => rows.map(personWithHouseholdDbToApi))
        ),
      getById: (id) =>
        Effect.gen(function* getPersonByIdProgram() {
          const person = yield* fromDb(() =>
            getPersonWithHouseholdRowById(db, id)
          );
          if (!person) {
            return yield* Effect.fail(new PersonNotFound({ id }));
          }
          return personWithHouseholdDbToApi(person);
        }),
      add: (data) =>
        Effect.gen(function* addPersonProgram() {
          // A Head defines their Household, so a Head who already points at one
          // would give that Household a second Head.
          if (data.householdRole === HOUSEHOLD_ROLE.HEAD && data.householdId) {
            return yield* Effect.fail(new HouseholdAlreadyHasHead());
          }

          const personData = personApiToDb(data);
          let personId: string;

          if (data.householdId) {
            const person = yield* fromDb(() => insertPerson(personData, db));
            if (!person) {
              return yield* Effect.fail(
                internalFailure("Failed to create person")
              );
            }
            personId = person.id;
          } else {
            // The head defines the household: their contact details seed the
            // Household's shared values and are cleared on the person, who
            // then inherits them (no duplication — ADR-0001).
            const householdId = crypto.randomUUID();
            const [, personRows] = yield* fromDb(() =>
              db.batch([
                insertHouseholdStmt(db, {
                  id: householdId,
                  ...householdWriteFields(data),
                }),
                insertPersonStmt(db, {
                  ...personData,
                  ...NULL_PERSON_CONTACT,
                  householdId,
                }),
              ])
            );
            const createdPerson = personRows[0];
            if (!createdPerson) {
              return yield* Effect.fail(
                internalFailure("Failed to create person")
              );
            }
            personId = createdPerson.id;
          }

          const created = yield* fromDb(() =>
            getPersonWithHouseholdRowById(db, personId)
          );
          if (!created) {
            return yield* Effect.fail(
              internalFailure("Failed to read the created person")
            );
          }
          return personWithHouseholdDbToApi(created);
        }),
      update: (id, data) =>
        Effect.gen(function* updatePersonProgram() {
          const current = yield* fromDb(() => getPersonRowById(db, id));
          if (!current) {
            return yield* Effect.fail(new PersonNotFound({ id }));
          }

          // A Head defines their Household: they cannot move to another one,
          // and a Household cannot gain a second Head.
          if (
            current.householdRole === HOUSEHOLD_ROLE.HEAD &&
            data.householdId !== current.householdId
          ) {
            return yield* Effect.fail(new HouseholdAlreadyHasHead());
          }
          const targetHouseholdId = data.householdId;
          if (targetHouseholdId && data.householdRole === HOUSEHOLD_ROLE.HEAD) {
            const targetHead = yield* fromDb(() =>
              getHouseholdHeadRow(db, targetHouseholdId)
            );
            if (targetHead && targetHead.id !== id) {
              return yield* Effect.fail(new HouseholdAlreadyHasHead());
            }
          }

          const { rows, affected } = yield* maritalStatus.readGraph([id]);

          // A governing spouse link is the source of truth (ADR-0003); a
          // manual value that disagrees is rejected so the two cannot drift.
          const governingMaritalStatus = yield* maritalStatus.governingStatus(
            rows,
            id
          );
          if (
            governingMaritalStatus &&
            data.maritalStatus !== governingMaritalStatus
          ) {
            return yield* Effect.fail(new MaritalStatusConflict());
          }

          const personData = personFormToDbFields(data);
          const overrides = new Map([
            [id, data.membershipStatus ?? current.membershipStatus],
          ]);
          const plans = yield* maritalStatus.planUpdates(
            rows,
            affected,
            overrides
          );
          const maritalStmts = plans.map((plan) =>
            updatePersonStmt(db, plan.personId, {
              maritalStatus: plan.maritalStatus,
            })
          );

          const existingHouseholdId = data.householdId;

          if (!existingHouseholdId) {
            const householdId = crypto.randomUUID();
            yield* fromDb(() =>
              db.batch([
                insertHouseholdStmt(db, {
                  id: householdId,
                  ...householdWriteFields(data),
                }),
                updatePersonStmt(db, id, {
                  ...personData,
                  ...NULL_PERSON_CONTACT,
                  householdId,
                }),
                ...maritalStmts,
              ])
            );
          } else if (data.householdRole === HOUSEHOLD_ROLE.HEAD) {
            // A head editing their own household updates the shared family
            // name and contact details on the Household; their own contact
            // columns stay cleared so they keep inheriting (ADR-0001).
            yield* fromDb(() =>
              db.batch([
                updatePersonStmt(db, id, {
                  ...personData,
                  ...NULL_PERSON_CONTACT,
                }),
                updateHouseholdStmt(
                  db,
                  existingHouseholdId,
                  householdWriteFields(data)
                ),
                ...maritalStmts,
              ])
            );
          } else {
            yield* fromDb(() =>
              db.batch([updatePersonStmt(db, id, personData), ...maritalStmts])
            );
          }

          const updated = yield* fromDb(() =>
            getPersonWithHouseholdRowById(db, id)
          );
          if (!updated) {
            return yield* Effect.fail(new PersonNotFound({ id }));
          }
          return personWithHouseholdDbToApi(updated);
        }),
    };
  })
);

/** Lists every Person with their Household's shared contact fields. */
export const getAllPeople = Effect.gen(function* getAllPeopleProgram() {
  const people = yield* People;
  return yield* people.getAll();
});

/** Reads one Person, failing when the id is unknown. */
export const getPersonById = (id: string) =>
  Effect.gen(function* getPersonByIdProgram() {
    const people = yield* People;
    return yield* people.getById(id);
  });

/** Creates a Person, creating their Household when they are a head. */
export const addPerson = (data: PersonInsertForm) =>
  Effect.gen(function* addPersonProgram() {
    const people = yield* People;
    return yield* people.add(data);
  });

/** Updates a Person and every Marital Status the write changes. */
export const updatePerson = (id: string, data: PersonInsertForm) =>
  Effect.gen(function* updatePersonProgram() {
    const people = yield* People;
    return yield* people.update(id, data);
  });
