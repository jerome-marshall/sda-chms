import { describe, expect, it } from "vite-plus/test";

import {
  getDbConstraintViolation,
  isDrizzleErrorLike,
} from "../../src/db/schema/lib/db-errors";

/** A better-sqlite3 SqliteError shape: code + constraint text in the message. */
const sqliteCause = (overrides: object = {}) =>
  Object.assign(new Error("UNIQUE constraint failed: people.email"), {
    name: "SqliteError",
    code: "SQLITE_CONSTRAINT_UNIQUE",
    ...overrides,
  });

/**
 * better-sqlite3 throws its SqliteError unwrapped (drizzle does not wrap
 * sync-driver failures), while D1 may wrap the failure or surface it as
 * message text. These tests drive the mapper with both shapes; the old
 * `instanceof DrizzleQueryError` check missed the worker-runtime rewrap,
 * which only the code/message keeps.
 */
describe("getDbConstraintViolation across module copies", () => {
  it("maps a unique violation to 409", () => {
    const result = getDbConstraintViolation(sqliteCause());
    expect(result?.httpCode).toBe(409);
    expect(result?.constraint).toBe("people.email");
    expect(result?.message).toContain("duplicate");
  });

  it("maps the identity unique index to the friendly message", () => {
    const result = getDbConstraintViolation(
      sqliteCause({
        message:
          "UNIQUE constraint failed: people.first_name, people.identity_last_name, people.identity_date_of_birth",
      })
    );
    expect(result?.httpCode).toBe(409);
    expect(result?.constraint).toBe("unique_person_identity");
    expect(result?.message).toContain("may already exist");
  });

  it("maps a unique violation behind a wrapper to 409", () => {
    const error = new Error("Failed query: insert into people (id) values (?)");
    (error as { cause?: unknown }).cause = sqliteCause();
    const result = getDbConstraintViolation(error);
    expect(result?.httpCode).toBe(409);
    expect(result?.message).toContain("duplicate");
    expect(result?.message).not.toContain("Failed query");
  });

  it("maps D1-remote constraint text without a code the same way", () => {
    const result = getDbConstraintViolation(
      new Error("D1_ERROR: UNIQUE constraint failed: people.email")
    );
    expect(result?.httpCode).toBe(409);
    expect(result?.message).toContain("duplicate");
  });

  it("maps a foreign key violation to 422", () => {
    const result = getDbConstraintViolation(
      sqliteCause({
        message: "FOREIGN KEY constraint failed",
        code: "SQLITE_CONSTRAINT_FOREIGNKEY",
      })
    );
    expect(result?.httpCode).toBe(422);
    expect(result?.message).toContain("foreign key");
  });

  it("maps a not-null violation to 400 with the column", () => {
    const result = getDbConstraintViolation(
      sqliteCause({
        message: "NOT NULL constraint failed: people.first_name",
        code: "SQLITE_CONSTRAINT_NOTNULL",
      })
    );
    expect(result?.httpCode).toBe(400);
    expect(result?.message).toContain("first_name");
  });

  it("returns null for ordinary errors and unrecognized failures", () => {
    expect(getDbConstraintViolation(new Error("Person not found"))).toBeNull();
    expect(
      getDbConstraintViolation(
        new Error("Failed query: insert into people (id) values (?)")
      )
    ).toBeNull();
    const error = new Error(
      "Failed query: insert into people (email) values ('a@b.c')"
    );
    (error as { cause?: unknown }).cause = Object.assign(
      new Error("unrecognized"),
      { name: "SqliteError", code: "SQLITE_ERROR" }
    );
    expect(getDbConstraintViolation(error)).toBeNull();
    expect(
      getDbConstraintViolation(
        sqliteCause({
          message: "some other sqlite failure",
          code: "SQLITE_ERROR",
        })
      )
    ).toBeNull();
  });
});

describe(isDrizzleErrorLike, () => {
  it("matches Drizzle names from any copy", () => {
    const error = new Error("boom");
    error.name = "DrizzleQueryError";
    expect(isDrizzleErrorLike(error)).toBe(true);
  });

  it("matches the Failed query message prefix", () => {
    expect(
      isDrizzleErrorLike(new Error("Failed query: insert into people"))
    ).toBe(true);
  });

  it("does not match ordinary errors", () => {
    expect(isDrizzleErrorLike(new Error("Person not found"))).toBe(false);
    expect(isDrizzleErrorLike("boom")).toBe(false);
  });
});
