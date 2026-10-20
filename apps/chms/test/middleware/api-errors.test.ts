import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { mapErrorToBody } from "../../server/lib/errors";
import { createTestApp } from "../routes";
import { resetDb } from "../void-db";

const json = async <T>(res: Response): Promise<T> => (await res.json()) as T;

describe("API error middleware (integration, SQLite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("rewrites a failed validation into VALIDATION_ERROR ApiErrorBody", async () => {
    const res = await app.request("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "" }),
    });
    expect(res.status).toBe(400);
    const body = await json<ApiErrorBody>(res);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.message).toBe("Validation failed");
  });

  it("rewrites an invalid JSON body into VALIDATION_ERROR ApiErrorBody", async () => {
    const res = await app.request("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    expect(res.status).toBe(400);
    const body = await json<ApiErrorBody>(res);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.message).toBe("Invalid JSON body");
  });
});

describe("mapErrorToBody (unit)", () => {
  it("maps HTTPException to its status with HTTP_ERROR", () => {
    const { status, body } = mapErrorToBody(
      new HTTPException(404, { message: "Person not found" })
    );
    expect(status).toBe(404);
    expect(body).toMatchObject({
      code: "HTTP_ERROR",
      message: "Person not found",
    });
  });

  it("maps ZodError to 400 VALIDATION_ERROR", () => {
    const parsed = personInsertFormSchema.safeParse({ firstName: "" });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      throw new Error("expected a validation failure");
    }
    const { status, body } = mapErrorToBody(parsed.error);
    expect(status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.message).toBeTypeOf("string");
  });

  it("never puts SQL text or bound values in a DB_ERROR body", () => {
    // Production D1 failures arrive as DrizzleQueryError, whose enumerable
    // query/params own fields would serialize into details. The stand-in
    // throws the unwrapped SqliteError, so this shape is pinned here.
    const cause = Object.assign(
      new Error("UNIQUE constraint failed: people.email"),
      { name: "SqliteError", code: "SQLITE_CONSTRAINT_UNIQUE" }
    );
    const error = Object.assign(
      new Error("Failed query: insert into people (email) values (?)"),
      {
        name: "DrizzleQueryError",
        query: "insert into people (email) values (?)",
        params: ["a@b.c"],
        cause,
      }
    );
    const { status, body } = mapErrorToBody(error);
    expect(status).toBe(409);
    expect(body.code).toBe("DB_ERROR");
    expect(body.details).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("insert into");
    expect(JSON.stringify(body)).not.toContain("a@b.c");
  });

  it("maps unknown errors to 500 HTTP_ERROR", () => {
    const { status, body } = mapErrorToBody(new Error("boom"));
    expect(status).toBe(500);
    expect(body).toMatchObject({ code: "HTTP_ERROR", message: "boom" });
  });

  it("never puts SQL text in a 500 body", () => {
    const error = new Error(
      "Failed query: insert into people (email) values ('a@b.c')"
    );
    const { status, body } = mapErrorToBody(error);
    expect(status).toBe(500);
    expect(body.code).toBe("HTTP_ERROR");
    expect(body.message).toBe("Internal Server Error");
    expect(JSON.stringify(body)).not.toContain("a@b.c");
  });

  it("maps non-errors to 500 with an Unknown error message", () => {
    const { status, body } = mapErrorToBody("boom");
    expect(status).toBe(500);
    expect(body).toMatchObject({
      code: "HTTP_ERROR",
      message: "Unknown error",
    });
  });
});
