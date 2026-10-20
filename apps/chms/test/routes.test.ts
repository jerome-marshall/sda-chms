import type { Hono } from "hono";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vite-plus/test";
import type { CloudContext } from "void/handler";

import { loader as personDetailLoader } from "../src/pages/people/[id]/index.server";
import { createTestApp, sortMiddlewareFiles } from "./routes";
import { resetDb } from "./void-db";

describe(sortMiddlewareFiles, () => {
  it("runs numeric prefixes first in ascending numeric order", () => {
    expect(
      sortMiddlewareFiles([
        "../middleware/10.last.ts",
        "../middleware/02.second.ts",
        "../middleware/01.api-errors.ts",
      ])
    ).toStrictEqual([
      "../middleware/01.api-errors.ts",
      "../middleware/02.second.ts",
      "../middleware/10.last.ts",
    ]);
  });

  it("runs unprefixed files last", () => {
    expect(
      sortMiddlewareFiles([
        "../middleware/zebra.ts",
        "../middleware/01.api-errors.ts",
        "../middleware/auth.ts",
      ])
    ).toStrictEqual([
      "../middleware/01.api-errors.ts",
      "../middleware/zebra.ts",
      "../middleware/auth.ts",
    ]);
  });

  it("ignores underscore-prefixed files like Void does", () => {
    expect(
      sortMiddlewareFiles([
        "../middleware/_helper.ts",
        "../middleware/01.api-errors.ts",
      ])
    ).toStrictEqual(["../middleware/01.api-errors.ts"]);
  });
});

describe("person detail loader (through void/client)", () => {
  let app: Hono;
  const realFetch = globalThis.fetch;

  beforeAll(() => {
    app = createTestApp();
    // Route the loader's relative void/client calls into the test app, the
    // way the worker dispatches them in-process during SSR.
    globalThis.fetch = ((input: string, init?: RequestInit) => {
      if (typeof input === "string" && input.startsWith("/")) {
        return app.request(input, init);
      }
      return realFetch(input, init);
    }) as typeof fetch;
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  const postPerson = (body: unknown) =>
    app.request("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("returns the same PersonDetail shape the API route returns", async () => {
    const created = await postPerson({
      firstName: "Loader",
      lastName: "Case",
      gender: "male",
      dateOfBirth: "1990-01-01",
      addressLine1: "123 Main St",
      city: "Hosur",
      state: "Tamil Nadu",
      country: "India",
      maritalStatus: "single",
      membershipStatus: "member",
      dietaryPreference: "none",
      householdRole: "head",
    });
    expect(created.status).toBe(200);
    const { id } = (await created.json()) as { id: string };

    const loadedRes = await personDetailLoader({
      req: { param: () => ({ id }) },
    } as unknown as CloudContext);
    // The framework converts loader output to a JSON response; the page
    // dispatcher parses it back into props the same way here.
    const loaded = (await (loadedRes as Response).json()) as {
      person: unknown;
      relationships: unknown[];
      people: { id: string }[];
    };

    const apiRes = await app.request(`/api/people/${id}`);
    expect(apiRes.status).toBe(200);
    await expect(apiRes.json()).resolves.toStrictEqual(loaded.person);
    expect(loaded.relationships).toStrictEqual([]);
    expect(loaded.people.map((person) => person.id)).toStrictEqual([id]);
  });
});
