import type { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { insertPerson } from "../../../../server/people";
import { createTestApp } from "../../../routes";
import { resetDb } from "../../../void-db";

/** Short, lowercase first name exercises issue #1 + the title-casing transformer. */
const validHead = {
  firstName: "jo",
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
};

/** The response fields these tests read. */
interface PersonResponse {
  addressLine1: string | null;
  fathersName: string | null;
  firstName: string;
  fullName: string;
  householdAddressLine1?: string | null;
  householdCity?: string | null;
  householdId: string | null;
  householdPhone?: string | null;
  householdPreferredVisitingTime?: string | null;
  id: string;
  isHeadOfHousehold: boolean;
  mothersName: string | null;
  phone: string | null;
}

const json = async <T>(res: Response): Promise<T> => (await res.json()) as T;

describe("GET /api/people/:id (integration, SQLite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  const postPerson = (body: unknown) =>
    app.request("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("GET /api/people/:id returns the person with computed + head fields", async () => {
    const created = await json<PersonResponse>(await postPerson(validHead));
    const res = await app.request(`/api/people/${created.id}`);
    expect(res.status).toBe(200);

    const person = await json<PersonResponse>(res);
    expect(person.id).toBe(created.id);
    expect(person.fullName).toBe("Jo");
    expect(person.isHeadOfHousehold).toBe(true);
  });

  it("GET /api/people/:id falls a member's missing contact back to the Household (ADR-0001)", async () => {
    // The head defines the household's shared phone; the child carries none.
    const head = await json<PersonResponse>(
      await postPerson({ ...validHead, phone: "9000000000" })
    );
    const child = await json<PersonResponse>(
      await postPerson({
        firstName: "li",
        gender: "male",
        dateOfBirth: "2012-01-01",
        maritalStatus: "single",
        membershipStatus: "member",
        dietaryPreference: "none",
        householdRole: "child",
        householdId: head.householdId,
      })
    );

    const res = await app.request(`/api/people/${child.id}`);
    expect(res.status).toBe(200);

    const person = await json<PersonResponse>(res);
    expect(person.fullName).toBe("Li");
    expect(person.isHeadOfHousehold).toBe(false);
    expect(person.phone).toBeFalsy();
    // The effective value falls back to the Household, not the Head person.
    expect(person.householdPhone).toBe("9000000000");
  });

  it("POST /api/people stores and returns father's name and mother's name (issue #11)", async () => {
    const res = await postPerson({
      ...validHead,
      fathersName: "Joseph Krishnamurthy",
      mothersName: "Mary Krishnamurthy",
    });
    expect(res.status).toBe(200);
    const person = await json<PersonResponse>(res);
    expect(person.fathersName).toBe("Joseph Krishnamurthy");
    expect(person.mothersName).toBe("Mary Krishnamurthy");

    const detail = await json<PersonResponse>(
      await app.request(`/api/people/${person.id}`)
    );
    expect(detail.fathersName).toBe("Joseph Krishnamurthy");
    expect(detail.mothersName).toBe("Mary Krishnamurthy");
  });

  it("a head can rename their family via PUT /api/people/:id", async () => {
    const head = await json<PersonResponse>(
      await postPerson({ ...validHead, familyName: "The Smiths" })
    );

    const putRes = await app.request(`/api/people/${head.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validHead,
        householdId: head.householdId,
        familyName: "The Robinson-Smiths",
      }),
    });
    expect(putRes.status).toBe(200);

    const res = await app.request("/api/households");
    const households = await json<{ name: string }[]>(res);
    expect(households[0]?.name).toBe("The Robinson-Smiths");
  });

  // Household-owned contact details (ADR-0001): the Household owns the
  // shared contact details (address, phone, preferred visiting time). A
  // member's effective value is their own if set, otherwise the Household's.

  it("stores the head's contact details on the Household, not the head Person", async () => {
    const head = await json<PersonResponse>(
      await postPerson({
        ...validHead,
        phone: "9000000000",
        preferredVisitingTime: "Evenings",
      })
    );

    const detail = await json<PersonResponse>(
      await app.request(`/api/people/${head.id}`)
    );
    // The head's own contact columns are cleared — the values live on the
    // Household and the head inherits them like everyone else.
    expect(detail.phone).toBeFalsy();
    expect(detail.addressLine1).toBeFalsy();
    expect(detail.householdPhone).toBe("9000000000");
    expect(detail.householdAddressLine1).toBe("123 Main St");
    expect(detail.householdPreferredVisitingTime).toBe("Evenings");
  });

  it("a member with no own value inherits the Household's contact details", async () => {
    const head = await json<PersonResponse>(
      await postPerson({ ...validHead, phone: "9000000000" })
    );

    // A member with none of their own contact details.
    const member = await insertPerson({
      firstName: "Li",
      maritalStatus: "single",
      membershipStatus: "member",
      isActive: true,
      householdId: head.householdId,
      householdRole: "child",
    });

    const detail = await json<PersonResponse>(
      await app.request(`/api/people/${member?.id}`)
    );
    expect(detail.phone).toBeFalsy();
    expect(detail.householdPhone).toBe("9000000000");
    expect(detail.householdCity).toBe("Hosur");
  });

  it("a member with an own value overrides the Household's", async () => {
    const head = await json<PersonResponse>(
      await postPerson({ ...validHead, phone: "9000000000" })
    );

    const member = await insertPerson({
      firstName: "Li",
      maritalStatus: "single",
      membershipStatus: "member",
      isActive: true,
      phone: "9111111111",
      householdId: head.householdId,
      householdRole: "child",
    });

    const detail = await json<PersonResponse>(
      await app.request(`/api/people/${member?.id}`)
    );
    expect(detail.phone).toBe("9111111111");
    // The household value is still surfaced so the UI knows the default.
    expect(detail.householdPhone).toBe("9000000000");
  });

  it("updating the Household's contact updates the effective value of members without an override", async () => {
    const head = await json<PersonResponse>(
      await postPerson({ ...validHead, phone: "9000000000" })
    );
    const member = await insertPerson({
      firstName: "Li",
      maritalStatus: "single",
      membershipStatus: "member",
      isActive: true,
      householdId: head.householdId,
      householdRole: "child",
    });

    // The head edits the shared address/phone.
    await app.request(`/api/people/${head.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validHead,
        householdId: head.householdId,
        phone: "9222222222",
        addressLine1: "456 New Rd",
      }),
    });

    const detail = await json<PersonResponse>(
      await app.request(`/api/people/${member?.id}`)
    );
    expect(detail.householdPhone).toBe("9222222222");
    expect(detail.householdAddressLine1).toBe("456 New Rd");
  });

  it("moving a member to another Household re-points their inherited values", async () => {
    const head1 = await json<PersonResponse>(
      await postPerson({ ...validHead, phone: "9000000000" })
    );
    const head2 = await json<PersonResponse>(
      await postPerson({
        ...validHead,
        firstName: "jane",
        lastName: "doe",
        phone: "9333333333",
        city: "Bangalore",
      })
    );

    const member = await insertPerson({
      firstName: "Li",
      maritalStatus: "single",
      membershipStatus: "member",
      isActive: true,
      householdId: head1.householdId,
      householdRole: "child",
    });

    const before = await json<PersonResponse>(
      await app.request(`/api/people/${member?.id}`)
    );
    expect(before.householdCity).toBe("Hosur");

    // Move to the other household.
    await app.request(`/api/people/${member?.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Li",
        maritalStatus: "single",
        membershipStatus: "member",
        dietaryPreference: "none",
        gender: "male",
        dateOfBirth: "2010-01-01",
        householdId: head2.householdId,
        householdRole: "child",
      }),
    });

    const after = await json<PersonResponse>(
      await app.request(`/api/people/${member?.id}`)
    );
    expect(after.householdCity).toBe("Bangalore");
    expect(after.householdPhone).toBe("9333333333");
  });
});
