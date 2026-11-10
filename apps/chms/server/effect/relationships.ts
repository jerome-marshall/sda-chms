import type { RelationshipsSelectDb } from "@schema";
import {
  RELATIONSHIP_TYPE,
  SPOUSE_STATE,
} from "@sda-chms/shared/constants/people";
import type { SPOUSE_STATE_VALUES } from "@sda-chms/shared/constants/people";
import type { RelationshipCreate } from "@sda-chms/shared/schema/people";
import { Context, Effect, Layer } from "effect";

import { getPersonRowById, updatePersonStmt } from "../people";
import {
  deleteRelationshipStmt,
  getRelationshipRowById,
  getRelationshipsForPersonRows,
  insertRelationshipStmt,
  relationshipDbToApi,
  updateRelationshipStateStmt,
} from "../relationships";
import { Db, fromDb } from "./db";
import {
  internalFailure,
  RelationshipNotFound,
  SpouseStateOnNonSpouse,
} from "./errors";
import type { DatabaseFailure } from "./errors";
import { MaritalStatus } from "./marital-status";

type Relationship = RelationshipsSelectDb;
type SpouseState = (typeof SPOUSE_STATE_VALUES)[number];

/** The Relationship operations the API exposes. */
export interface RelationshipsService {
  readonly listForPerson: (
    personId: string
  ) => Effect.Effect<ReturnType<typeof relationshipDbToApi>[], DatabaseFailure>;
  readonly add: (
    data: RelationshipCreate
  ) => Effect.Effect<Relationship, DatabaseFailure>;
  readonly updateState: (
    id: string,
    state: SpouseState
  ) => Effect.Effect<
    Relationship,
    RelationshipNotFound | SpouseStateOnNonSpouse | DatabaseFailure
  >;
  readonly remove: (
    id: string
  ) => Effect.Effect<{ id: string }, RelationshipNotFound | DatabaseFailure>;
}

/** Relationship links and their spouse lifecycle behind Effect. */
export class Relationships extends Context.Service<
  Relationships,
  RelationshipsService
>()("Relationships") {}

const createdRow = (
  rows: Relationship[] | undefined
): Effect.Effect<Relationship, DatabaseFailure> => {
  const created = rows?.[0];
  return created
    ? Effect.succeed(created)
    : Effect.fail(internalFailure("Failed to create relationship"));
};

/** Builds the Relationship service from the request-scoped database and spouse rules. */
export const RelationshipsLive = Layer.effect(
  Relationships,
  Effect.gen(function* RelationshipsLive() {
    const db = yield* Db;
    const maritalStatus = yield* MaritalStatus;

    return {
      listForPerson: (personId) =>
        fromDb(() => getRelationshipsForPersonRows(db, personId)).pipe(
          Effect.map((rows) =>
            rows.map((row) => relationshipDbToApi(row, personId))
          )
        ),
      add: (data) =>
        Effect.gen(function* addRelationshipProgram() {
          const state =
            data.type === RELATIONSHIP_TYPE.SPOUSE
              ? (data.state ?? SPOUSE_STATE.MARRIED)
              : null;
          const id = crypto.randomUUID();
          const link = { ...data, id, state };

          if (data.type !== RELATIONSHIP_TYPE.SPOUSE) {
            const [createdRows] = yield* fromDb(() =>
              db.batch([insertRelationshipStmt(db, link)])
            );
            return yield* createdRow(createdRows);
          }

          const [person, relatedPerson] = yield* Effect.all(
            [
              fromDb(() => getPersonRowById(db, data.personId)),
              fromDb(() => getPersonRowById(db, data.relatedPersonId)),
            ],
            { concurrency: "unbounded" }
          );

          // Let the database enforce the link when either side is unknown:
          // the insert fails on the foreign key, so the API keeps the 422 it
          // has always returned instead of inventing a new error.
          if (!person || !relatedPerson) {
            const [createdRows] = yield* fromDb(() =>
              db.batch([insertRelationshipStmt(db, link)])
            );
            return yield* createdRow(createdRows);
          }

          const { rows, affected } = yield* maritalStatus.readGraph([
            data.personId,
            data.relatedPersonId,
          ]);
          const postWriteRows = [
            ...rows,
            {
              id,
              personId: data.personId,
              relatedPersonId: data.relatedPersonId,
              type: RELATIONSHIP_TYPE.SPOUSE,
              state,
              createdAt: new Date(),
              person: {
                id: person.id,
                membershipStatus: person.membershipStatus,
              },
              relatedPerson: {
                id: relatedPerson.id,
                membershipStatus: relatedPerson.membershipStatus,
              },
            },
          ];

          const plans = yield* maritalStatus.planUpdates(
            postWriteRows,
            affected
          );
          const [createdRows] = yield* fromDb(() =>
            db.batch([
              insertRelationshipStmt(db, link),
              ...plans.map((plan) =>
                updatePersonStmt(db, plan.personId, {
                  maritalStatus: plan.maritalStatus,
                })
              ),
            ])
          );
          return yield* createdRow(createdRows);
        }),
      updateState: (id, state) =>
        Effect.gen(function* updateRelationshipProgram() {
          const existing = yield* fromDb(() => getRelationshipRowById(db, id));
          if (!existing) {
            return yield* Effect.fail(new RelationshipNotFound({ id }));
          }

          // Only a spouse link carries a lifecycle state; persisting one on
          // any other type would violate the column's invariant.
          if (existing.type !== RELATIONSHIP_TYPE.SPOUSE) {
            return yield* Effect.fail(new SpouseStateOnNonSpouse());
          }

          const { rows, affected } = yield* maritalStatus.readGraph([
            existing.personId,
            existing.relatedPersonId,
          ]);
          const postWriteRows = rows.map((row) =>
            row.id === id ? { ...row, state } : row
          );
          const plans = yield* maritalStatus.planUpdates(
            postWriteRows,
            affected
          );
          const [updatedRows] = yield* fromDb(() =>
            db.batch([
              updateRelationshipStateStmt(db, id, state),
              ...plans.map((plan) =>
                updatePersonStmt(db, plan.personId, {
                  maritalStatus: plan.maritalStatus,
                })
              ),
            ])
          );
          const updated = updatedRows?.[0];
          if (!updated) {
            return yield* Effect.fail(new RelationshipNotFound({ id }));
          }
          return updated;
        }),
      remove: (id) =>
        Effect.gen(function* removeRelationshipProgram() {
          const existing = yield* fromDb(() => getRelationshipRowById(db, id));
          if (!existing) {
            return yield* Effect.fail(new RelationshipNotFound({ id }));
          }

          if (existing.type !== RELATIONSHIP_TYPE.SPOUSE) {
            yield* fromDb(() => db.batch([deleteRelationshipStmt(db, id)]));
            return { id };
          }

          const { rows, affected } = yield* maritalStatus.readGraph([
            existing.personId,
            existing.relatedPersonId,
          ]);
          const postWriteRows = rows.filter((row) => row.id !== id);
          const plans = yield* maritalStatus.planUpdates(
            postWriteRows,
            affected
          );
          yield* fromDb(() =>
            db.batch([
              deleteRelationshipStmt(db, id),
              ...plans.map((plan) =>
                updatePersonStmt(db, plan.personId, {
                  maritalStatus: plan.maritalStatus,
                })
              ),
            ])
          );
          return { id: existing.id };
        }),
    };
  })
);

/** Lists a Person's Relationships from their perspective. */
export const getPersonRelationships = (personId: string) =>
  Effect.gen(function* listRelationshipsProgram() {
    const relationships = yield* Relationships;
    return yield* relationships.listForPerson(personId);
  });

/** Creates a Relationship, keeping spouse Marital Status in step. */
export const addRelationship = (data: RelationshipCreate) =>
  Effect.gen(function* addRelationshipProgram() {
    const relationships = yield* Relationships;
    return yield* relationships.add(data);
  });

/** Changes a spouse link's lifecycle state. */
export const updateRelationshipState = (id: string, state: SpouseState) =>
  Effect.gen(function* updateRelationshipProgram() {
    const relationships = yield* Relationships;
    return yield* relationships.updateState(id, state);
  });

/** Removes a Relationship and re-evaluates the affected Marital Status. */
export const removeRelationship = (id: string) =>
  Effect.gen(function* removeRelationshipProgram() {
    const relationships = yield* Relationships;
    return yield* relationships.remove(id);
  });
