import type { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vite-plus/test";

import { createTestApp } from "../../routes";

describe("unknown API paths (integration, PGlite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  it("GET /api/does-not-exist returns a JSON 404", async () => {
    const res = await app.request("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(await res.json()).toStrictEqual({
      code: "HTTP_ERROR",
      message: "Not found",
    });
  });

  it("a real route still answers with the catch-all present", async () => {
    const res = await app.request("/api/groups");
    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual([]);
  });
});
