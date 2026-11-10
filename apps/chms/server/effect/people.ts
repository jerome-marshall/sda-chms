import { Context, Effect, Layer } from "effect";
import { HTTPException } from "hono/http-exception";

import {
  getAllPeopleWithHouseholdRows,
  getPersonWithHouseholdRowById,
  personWithHouseholdDbToApi,
} from "../people";
import type { PersonWithHouseholdApi } from "../people";
import { Db, fromDb } from "./db";

/** The People read operations the API exposes. */
export interface PeopleService {
  readonly getAll: () => Effect.Effect<PersonWithHouseholdApi[], unknown>;
  readonly getById: (
    id: string
  ) => Effect.Effect<PersonWithHouseholdApi, unknown>;
}

/** People reads behind Effect; each call uses the request's `Db` service. */
export class People extends Context.Service<People, PeopleService>()(
  "People"
) {}

/** Builds the People service from the request-scoped database. */
export const PeopleLive = Layer.effect(
  People,
  Effect.gen(function* PeopleLive() {
    const db = yield* Db;
    return {
      getAll: () =>
        fromDb(() => getAllPeopleWithHouseholdRows(db)).pipe(
          Effect.map((rows) => rows.map(personWithHouseholdDbToApi))
        ),
      getById: (id) =>
        fromDb(() => getPersonWithHouseholdRowById(db, id)).pipe(
          Effect.flatMap((person) =>
            person
              ? Effect.succeed(personWithHouseholdDbToApi(person))
              : Effect.fail(
                  new HTTPException(404, { message: "Person not found" })
                )
          )
        ),
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
