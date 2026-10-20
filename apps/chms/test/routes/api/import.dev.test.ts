import type { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { createTestApp } from "../../routes";
import { resetDb } from "../../void-db";

const json = async <T>(res: Response): Promise<T> => (await res.json()) as T;

interface ImportSummary {
  attempted: number;
  failed: number;
  skipped: number;
  succeeded: number;
  total: number;
}

const csv = [
  "Name,Gender,DOB,Family,Relation,Phone",
  "Test Head,male,01/02/1990,Testers,head,9000000000",
  "Test Child,male,03/04/2015,Testers,child,",
  "Test Orphan,male,05/06/2000,,spouse,",
].join("\n");

describe("POST /api/import (integration, SQLite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("imports the household and its members into local D1", async () => {
    const res = await app.request("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    expect(res.status).toBe(200);
    const summary = await json<ImportSummary>(res);
    expect(summary).toMatchObject({
      total: 3,
      skipped: 0,
      attempted: 2,
      succeeded: 2,
      failed: 1,
    });

    const people = await json<Record<string, unknown>[]>(
      await app.request("/api/people")
    );
    expect(people).toHaveLength(2);
    expect(
      people
        .flatMap((person) => Object.keys(person))
        .filter((key) => key.startsWith("identity_"))
    ).toStrictEqual([]);

    const households = await json<{ name: string }[]>(
      await app.request("/api/households")
    );
    expect(households).toHaveLength(1);
  });

  it("stores the grouped family name on the household", async () => {
    const res = await app.request("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    expect(res.status).toBe(200);

    const households = await json<{ name: string }[]>(
      await app.request("/api/households")
    );
    expect(households).toHaveLength(1);
    expect(households[0]?.name).toBe("Testers");
  });

  it("rejects an empty payload with 400", async () => {
    const res = await app.request("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: "" }),
    });
    expect(res.status).toBe(400);
  });
});
