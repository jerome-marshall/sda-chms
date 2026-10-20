import type { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { createTestApp } from "../../../routes";
import { resetDb } from "../../../void-db";

describe("GET /api/groups (integration, SQLite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("GET /api/groups returns an empty list initially", async () => {
    const res = await app.request("/api/groups");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toStrictEqual([]);
  });
});
