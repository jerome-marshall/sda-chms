import { Effect } from "effect";
import { HTTPException } from "hono/http-exception";
import { describe, expect, it, vi } from "vite-plus/test";

import {
  ImportLimitExceeded,
  InfraError,
  MaritalStatusConflict,
  PersonNotFound,
  RelationshipNotFound,
  SpouseStateOnNonSpouse,
  internalFailure,
} from "../../server/effect/errors";
import type { ApiError } from "../../server/effect/errors";
import { runApi } from "../../server/effect/runtime";
import { mapErrorToBody } from "../../server/lib/errors";

/** What the edge threw for a program that failed with `failure`. */
const thrownFor = async (failure: ApiError): Promise<unknown> => {
  try {
    await runApi(Effect.fail(failure));
  } catch (error) {
    return error;
  }
  throw new Error("expected the program to fail");
};

describe("the route edge maps each failure group once", () => {
  it("maps a missing Person to 404", async () => {
    const thrown = await thrownFor(new PersonNotFound({ id: "unknown" }));
    expect(thrown).toBeInstanceOf(HTTPException);
    const { status, body } = mapErrorToBody(thrown);
    expect(status).toBe(404);
    expect(body).toMatchObject({
      code: "HTTP_ERROR",
      message: "Person not found",
    });
  });

  it("maps every domain rule to its status", async () => {
    const cases = [
      [new RelationshipNotFound({ id: "unknown" }), 404],
      [new MaritalStatusConflict(), 400],
      [new SpouseStateOnNonSpouse(), 400],
      [new ImportLimitExceeded({ rows: 3, limit: 2 }), 400],
    ] as const;

    for (const [error, expected] of cases) {
      const thrown = await thrownFor(error);
      expect(mapErrorToBody(thrown).status).toBe(expected);
    }
  });

  it("rethrows the InfraError cause so the constraint mapper still applies", async () => {
    const cause = Object.assign(
      new Error("UNIQUE constraint failed: people.email"),
      { name: "SqliteError", code: "SQLITE_CONSTRAINT_UNIQUE" }
    );
    const thrown = await thrownFor(new InfraError({ cause }));
    expect(thrown).toBe(cause);

    const { status, body } = mapErrorToBody(thrown);
    expect(status).toBe(409);
    expect(body.code).toBe("DB_ERROR");
  });

  it("turns an InfraError with no constraint into a 500 carrying the cause", async () => {
    const cause = new Error("D1 unavailable");
    const thrown = await thrownFor(new InfraError({ cause }));
    expect(thrown).toBe(cause);

    const { status, body } = mapErrorToBody(thrown);
    expect(status).toBe(500);
    expect(body.message).toBe("D1 unavailable");
  });

  it("maps a broken invariant to a generic 500 with no developer text", async () => {
    const log = vi.spyOn(console, "error");
    const developerText = "Failed to read the created person";

    const thrown = await thrownFor(internalFailure(developerText));

    expect(thrown).toBeInstanceOf(HTTPException);
    const { status, body } = mapErrorToBody(thrown);
    expect(status).toBe(500);
    expect(body.message).toBe("Internal Server Error");
    expect(JSON.stringify(body)).not.toContain(developerText);
    expect(log).toHaveBeenCalledWith("🔴 invariant failed", expect.any(Error));
    log.mockRestore();
  });
});
