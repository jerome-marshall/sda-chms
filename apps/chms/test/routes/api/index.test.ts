import type { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vite-plus/test";

import { createTestApp } from "../../routes";

describe("bare /api (integration, SQLite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  it("GET /api returns a JSON 404", async () => {
    const res = await app.request("/api");
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toStrictEqual({
      code: "HTTP_ERROR",
      message: "Not found",
    });
  });

  it("POST /api returns a JSON 404", async () => {
    const res = await app.request("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toStrictEqual({
      code: "HTTP_ERROR",
      message: "Not found",
    });
  });
});
