import { describe, expect, it } from "vite-plus/test";

import {
  getDbErrorMessage,
  isDrizzleErrorLike,
} from "../../db/schema/lib/db-errors";

const pgCause = (overrides: object = {}) =>
  Object.assign(
    new Error(
      'duplicate key value violates unique constraint "people_email_unique"'
    ),
    {
      name: "DatabaseError",
      code: "23505",
      constraint: "people_email_unique",
      ...overrides,
    }
  );

/**
 * The dev and production builds bundle drizzle-orm separately from the app
 * code, so the wrapper's class identity (and even its `name`) does not
 * survive — only the driver cause keeps its shape. These tests drive the
 * mapper with plain-Error wrappers shaped like the worker runtime produces,
 * which the old `instanceof DrizzleQueryError` check missed.
 */
describe("getDbErrorMessage across module copies", () => {
  it("maps a unique violation behind a plain-Error wrapper to 409", () => {
    const error = new Error(
      "Failed query: insert into people (id) values ($1)"
    );
    (error as { cause?: unknown }).cause = pgCause();
    const result = getDbErrorMessage(error);
    expect(result.httpCode).toBe(409);
    expect(result.constraint).toBe("people_email_unique");
    expect(result.message).toContain("duplicate");
    expect(result.message).not.toContain("Failed query");
  });

  it("maps the identity unique index to the friendly message", () => {
    const error = new Error("Failed query: insert into people");
    (error as { cause?: unknown }).cause = pgCause({
      constraint: "unique_person_identity",
    });
    const result = getDbErrorMessage(error);
    expect(result.httpCode).toBe(409);
    expect(result.message).toContain("may already exist");
  });

  it("never puts SQL text in the fallback message", () => {
    const error = new Error(
      "Failed query: insert into people (email) values ('a@b.c')"
    );
    (error as { cause?: unknown }).cause = Object.assign(
      new Error("unrecognized"),
      { name: "DatabaseError", code: "XX999" }
    );
    const result = getDbErrorMessage(error);
    expect(result.httpCode).toBe(500);
    expect(result.message).not.toContain("Failed query");
    expect(result.message).not.toContain("a@b.c");
  });

  it("keeps ordinary error messages intact", () => {
    const result = getDbErrorMessage(new Error("Person not found"));
    expect(result.httpCode).toBe(500);
    expect(result.message).toBe("Person not found");
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
