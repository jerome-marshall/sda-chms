import { setTestDb } from "@sda-chms/db";
import { createTestDb, type TestDb } from "@sda-chms/db/test-db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { insertPerson } from "../data-access/people";
import app from "../index";

/**
 * ADR-0001: the Household owns the shared contact details (address, phone,
 * preferred visiting time). A member's effective value is their own if set,
 * otherwise the Household's. These tests drive the real server + PGlite path.
 */

/** A head that defines a new household, carrying the shared contact details. */
const validHead = {
  firstName: "john",
  lastName: "smith",
  gender: "male",
  dateOfBirth: "1990-01-01",
  addressLine1: "123 Main St",
  city: "Hosur",
  state: "Tamil Nadu",
  country: "India",
  phone: "9000000000",
  preferredVisitingTime: "Evenings",
  maritalStatus: "single",
  membershipStatus: "member",
  dietaryPreference: "none",
  householdRole: "head",
};

interface PersonResponse {
  addressLine1: string | null;
  householdAddressLine1?: string | null;
  householdCity?: string | null;
  householdId: string | null;
  householdPhone?: string | null;
  householdPreferredVisitingTime?: string | null;
  id: string;
  phone: string | null;
}

const json = <T>(res: Response): Promise<T> => res.json() as Promise<T>;

const postPerson = (body: unknown) =>
  app.request("/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("household-owned contact details (integration, PGlite)", () => {
  let testDb: TestDb;

  beforeAll(async () => {
    testDb = await createTestDb();
    setTestDb(testDb.db);
  });

  afterAll(async () => {
    setTestDb(null);
    await testDb.close();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  it("stores the head's contact details on the Household, not the head Person", async () => {
    const head = await json<PersonResponse>(await postPerson(validHead));

    const detail = await json<PersonResponse>(
      await app.request(`/people/${head.id}`)
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
    const head = await json<PersonResponse>(await postPerson(validHead));

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
      await app.request(`/people/${member?.id}`)
    );
    expect(detail.phone).toBeFalsy();
    expect(detail.householdPhone).toBe("9000000000");
    expect(detail.householdCity).toBe("Hosur");
  });

  it("a member with an own value overrides the Household's", async () => {
    const head = await json<PersonResponse>(await postPerson(validHead));

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
      await app.request(`/people/${member?.id}`)
    );
    expect(detail.phone).toBe("9111111111");
    // The household value is still surfaced so the UI knows the default.
    expect(detail.householdPhone).toBe("9000000000");
  });

  it("updating the Household's contact updates the effective value of members without an override", async () => {
    const head = await json<PersonResponse>(await postPerson(validHead));
    const member = await insertPerson({
      firstName: "Li",
      maritalStatus: "single",
      membershipStatus: "member",
      isActive: true,
      householdId: head.householdId,
      householdRole: "child",
    });

    // The head edits the shared address/phone.
    await app.request(`/people/${head.id}`, {
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
      await app.request(`/people/${member?.id}`)
    );
    expect(detail.householdPhone).toBe("9222222222");
    expect(detail.householdAddressLine1).toBe("456 New Rd");
  });

  it("moving a member to another Household re-points their inherited values", async () => {
    const head1 = await json<PersonResponse>(await postPerson(validHead));
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
      await app.request(`/people/${member?.id}`)
    );
    expect(before.householdCity).toBe("Hosur");

    // Move to the other household.
    await app.request(`/people/${member?.id}`, {
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
      await app.request(`/people/${member?.id}`)
    );
    expect(after.householdCity).toBe("Bangalore");
    expect(after.householdPhone).toBe("9333333333");
  });
});
