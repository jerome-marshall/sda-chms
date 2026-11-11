/* eslint-disable max-classes-per-file -- one class per domain failure keeps the tagged union explicit */
import { Data } from "effect";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** A Person id that is not in the directory. */
export class PersonNotFound extends Data.TaggedError("PersonNotFound")<{
  readonly id: string;
}> {}

/** A Relationship id that is not in the directory. */
export class RelationshipNotFound extends Data.TaggedError(
  "RelationshipNotFound"
)<{ readonly id: string }> {}

/** A manual Marital Status that contradicts the governing spouse link (ADR-0003). */
export class MaritalStatusConflict extends Data.TaggedError(
  "MaritalStatusConflict"
) {}

/** A lifecycle state was supplied for a Relationship type that cannot carry one. */
export class SpouseStateOnNonSpouse extends Data.TaggedError(
  "SpouseStateOnNonSpouse"
) {}

/** A CSV larger than the import limit. */
export class ImportLimitExceeded extends Data.TaggedError(
  "ImportLimitExceeded"
)<{
  readonly rows: number;
  readonly limit: number;
}> {}

/** A Drizzle, D1, or other infrastructure failure, kept for the existing mapper. */
export class DatabaseFailure extends Data.TaggedError("DatabaseFailure")<{
  readonly cause: unknown;
}> {}

/** An internal invariant failed after a write; maps to a 500 like a plain Error. */
export const internalFailure = (message: string): DatabaseFailure =>
  new DatabaseFailure({ cause: new Error(message) });

/** Every failure a domain service may put in its error channel. */
export type DomainError =
  | PersonNotFound
  | RelationshipNotFound
  | MaritalStatusConflict
  | SpouseStateOnNonSpouse
  | ImportLimitExceeded;

/** Every failure `runApi` maps at the route edge. */
export type ApiError = DomainError | DatabaseFailure;

interface StatusAndMessage {
  readonly status: ContentfulStatusCode;
  readonly message: string;
}

const describe = (error: DomainError): StatusAndMessage => {
  switch (error._tag) {
    case "PersonNotFound": {
      return { status: 404, message: "Person not found" };
    }
    case "RelationshipNotFound": {
      return { status: 404, message: "Relationship not found" };
    }
    case "MaritalStatusConflict": {
      return {
        status: 400,
        message:
          "Marital Status follows the spouse Relationship and cannot contradict it",
      };
    }
    case "SpouseStateOnNonSpouse": {
      return {
        status: 400,
        message: "Only a spouse relationship can carry a lifecycle state",
      };
    }
    case "ImportLimitExceeded": {
      return {
        status: 400,
        message: `CSV has ${error.rows} rows, limit is ${error.limit}`,
      };
    }
    default: {
      throw new Error(`Unhandled domain error: ${String(error)}`);
    }
  }
};

/**
 * Turns a typed domain failure into the `HTTPException` the existing error
 * middleware already maps to `ApiErrorBody`. Keeping the translation here
 * means exactly one place builds the body and none of the wire shape changes.
 */
export const toHttpException = (error: DomainError): HTTPException => {
  const { status, message } = describe(error);
  return new HTTPException(status, { message });
};
