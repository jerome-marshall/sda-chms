import type { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { insertPerson } from "../../../../server/people";
import {
  createPerson,
  json,
  putPerson,
  readOk,
  validHead,
} from "../../../fixtures";
import type { PersonResponse } from "../../../fixtures";
import { createTestApp } from "../../../routes";
import { db, resetDb } from "../../../void-db";

interface Attempt {
  subject: PersonResponse;
  res: Response;
}

describe("one Head per Household through PUT /api/people/:id (integration, SQLite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  const getPerson = async (id: string) =>
    await readOk<PersonResponse>(await app.request(`/api/people/${id}`));

  const promoteMemberOfHeadedHousehold = async (): Promise<Attempt> => {
    const head = await createPerson(app);
    const member = await insertPerson(
      {
        firstName: "Li",
        householdId: head.householdId,
        householdRole: "child",
        maritalStatus: "single",
        membershipStatus: "member",
      },
      db
    );
    if (!member) {
      throw new Error("test: member insert returned nothing");
    }
    return {
      subject: await getPerson(member.id),
      res: await putPerson(app, member.id, {
        ...validHead,
        firstName: "li",
        dateOfBirth: "2012-01-01",
        householdId: head.householdId,
      }),
    };
  };

  const demoteOnlyHead = async (): Promise<Attempt> => {
    const head = await createPerson(app);
    return {
      subject: head,
      res: await putPerson(app, head.id, {
        ...validHead,
        householdId: head.householdId,
        householdRole: "child",
      }),
    };
  };

  const moveHeadToHeadedHousehold = async (): Promise<Attempt> => {
    const first = await createPerson(app);
    const second = await createPerson(app, {
      firstName: "ann",
      dateOfBirth: "1985-05-05",
    });
    return {
      subject: first,
      res: await putPerson(app, first.id, {
        ...validHead,
        householdId: second.householdId,
      }),
    };
  };

  const moveHeadToNewHousehold = async (): Promise<Attempt> => {
    const head = await createPerson(app);
    return { subject: head, res: await putPerson(app, head.id, validHead) };
  };

  it.each([
    [
      "promoting a member of a Household that has a Head",
      promoteMemberOfHeadedHousehold,
      "Household already has a head",
    ],
    ["demoting the only Head", demoteOnlyHead, "A household needs a head"],
    [
      "moving a Head into another Household",
      moveHeadToHeadedHousehold,
      "Household already has a head",
    ],
    [
      "moving a Head to a new Household",
      moveHeadToNewHousehold,
      "Household already has a head",
    ],
  ])(
    "refuses %s and leaves the Person as it was",
    async (_, attempt, message) => {
      const { subject, res } = await attempt();

      expect(res.status).toBe(409);
      await expect(json(res)).resolves.toStrictEqual({
        code: "HTTP_ERROR",
        message,
        details: { status: 409 },
      });
      const after = await getPerson(subject.id);
      expect([after.householdId, after.householdRole]).toStrictEqual([
        subject.householdId,
        subject.householdRole,
      ]);
    }
  );
});
