import type { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import {
  createPerson,
  createTwoPeople,
  json,
  listFor as listForPerson,
  postRelationship as postRelationshipTo,
  type RelationshipItem,
} from "../../../fixtures";
import { createTestApp } from "../../../routes";
import { resetDb } from "../../../void-db";

describe("PATCH and DELETE /api/relationships/:id (integration, SQLite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  const postRelationship = (body: unknown) => postRelationshipTo(app, body);

  const listFor = (personId: string) => listForPerson(app, personId);

  const patchState = (id: string, state: string) =>
    app.request(`/api/relationships/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });

  const seedTwoPeople = () => createTwoPeople(app);

  it("PATCH and DELETE return 404 for an unknown id", async () => {
    const unknown = "00000000-0000-4000-8000-000000000000";
    const patched = await patchState(unknown, "divorced");
    expect(patched.status).toBe(404);
    const deleted = await app.request(`/api/relationships/${unknown}`, {
      method: "DELETE",
    });
    expect(deleted.status).toBe(404);
  });

  it("refuses a lifecycle state on a non-spouse link", async () => {
    const { a, b } = await seedTwoPeople();
    await postRelationship({
      personId: b.id,
      relatedPersonId: a.id,
      type: "parent",
    });
    const benList = await json<RelationshipItem[]>(await listFor(b.id));
    const relId = benList[0]?.id;
    expect(relId).toBeTruthy();

    const res = await patchState(relId ?? "", "divorced");
    expect(res.status).toBe(400);

    const unchanged = await json<RelationshipItem[]>(await listFor(b.id));
    expect(unchanged[0]?.state).toBeNull();
  });

  it("removes a relationship from both perspectives", async () => {
    const { a, b } = await seedTwoPeople();
    await postRelationship({
      personId: b.id,
      relatedPersonId: a.id,
      type: "parent",
    });

    const benList = await json<RelationshipItem[]>(await listFor(b.id));
    const relId = benList[0]?.id;
    expect(relId).toBeTruthy();

    const del = await app.request(`/api/relationships/${relId}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(200);

    await expect(
      json<RelationshipItem[]>(await listFor(b.id))
    ).resolves.toHaveLength(0);
    await expect(
      json<RelationshipItem[]>(await listFor(a.id))
    ).resolves.toHaveLength(0);
  });

  it("persists the link through a state change (divorce does not delete it)", async () => {
    const { a, b } = await seedTwoPeople();
    const created = await json<{ id: string }>(
      await postRelationship({
        personId: a.id,
        relatedPersonId: b.id,
        type: "spouse",
        state: "married",
      })
    );

    const patched = await patchState(created.id, "divorced");
    expect(patched.status).toBe(200);

    // The link still exists on both sides, now divorced.
    const list = await json<RelationshipItem[]>(await listFor(a.id));
    expect(list).toHaveLength(1);
    expect(list[0]?.state).toBe("divorced");
    const other = await json<RelationshipItem[]>(await listFor(b.id));
    expect(other[0]?.state).toBe("divorced");
  });

  it("lets a person hold more than one spouse link in different states", async () => {
    const { a, b } = await seedTwoPeople();
    const c = await createPerson(app, { firstName: "cara" });

    const first = await json<{ id: string }>(
      await postRelationship({
        personId: a.id,
        relatedPersonId: b.id,
        type: "spouse",
        state: "married",
      })
    );
    await patchState(first.id, "divorced");
    await postRelationship({
      personId: a.id,
      relatedPersonId: c.id,
      type: "spouse",
      state: "married",
    });

    const list = await json<RelationshipItem[]>(await listFor(a.id));
    const spouses = list.filter((r) => r.type === "spouse");
    expect(spouses).toHaveLength(2);
    expect(
      spouses
        .map((s) => s.state)
        .toSorted((stateA, stateB) => {
          const x = stateA ?? "";
          const y = stateB ?? "";
          if (x < y) {
            return -1;
          }
          if (x > y) {
            return 1;
          }
          return 0;
        })
    ).toStrictEqual(["divorced", "married"]);
  });
});
