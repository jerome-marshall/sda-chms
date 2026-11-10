import { groupsTable } from "@schema";
import type { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { json } from "../../../fixtures";
import { createTestApp } from "../../../routes";
import { db, resetDb } from "../../../void-db";

describe("GET /api/groups (integration, SQLite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("lists the groups stored in the database", async () => {
    await db.insert(groupsTable).values({ name: "Choir" });

    const res = await app.request("/api/groups");
    expect(res.status).toBe(200);
    const groups = await json<{ name: string }[]>(res);
    expect(groups.map((group) => group.name)).toStrictEqual(["Choir"]);
  });
});
