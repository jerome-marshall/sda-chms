/* oxlint-disable vitest/prefer-importing-vitest-globals -- Playwright spec: test/expect come from @playwright/test, not Vitest */
import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

interface CreatedPerson {
  fullName: string;
  householdId: string;
  id: string;
}

const createPerson = async (
  request: APIRequestContext,
  overrides: Record<string, unknown> = {}
): Promise<CreatedPerson> => {
  const response = await request.post("/api/people", {
    data: {
      firstName: "Test",
      lastName: "Person",
      gender: "male",
      dateOfBirth: "1990-01-01",
      maritalStatus: "single",
      membershipStatus: "member",
      dietaryPreference: "none",
      householdRole: "head",
      ...overrides,
    },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as CreatedPerson;
};

test("a spouse link added in the UI updates Marital Status on both People", async ({
  page,
  request,
}) => {
  const suffix = Date.now();
  const ann = await createPerson(request, {
    firstName: "Ann",
    lastName: `Spouse ${suffix}`,
  });
  const ben = await createPerson(request, {
    firstName: "Ben",
    lastName: `Spouse ${suffix}`,
  });

  await page.goto(`/people/${ann.id}/edit`);
  await expect(
    page.getByRole("combobox", { name: "Related person" })
  ).toBeVisible();

  await page.getByRole("combobox", { name: "Related person" }).click();
  await page.getByRole("option", { name: ben.fullName, exact: true }).click();
  await page.getByRole("combobox", { name: "Relationship type" }).click();
  await page.getByRole("option", { name: "Spouse", exact: true }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();

  await expect(
    page.getByRole("button", { name: `Remove ${ben.fullName}` })
  ).toBeVisible();

  await page.goto(`/people/${ann.id}`);
  await expect(page.getByText("Marital Status")).toBeVisible();
  await expect(
    page.getByText("Married", { exact: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText(ben.fullName, { exact: true }).first()
  ).toBeVisible();

  await page.goto(`/people/${ben.id}`);
  await expect(
    page.getByText("Married", { exact: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText(ann.fullName, { exact: true }).first()
  ).toBeVisible();

  await page.goto(`/people/${ann.id}/edit`);
  await expect(
    page.getByRole("combobox", { name: "Spouse lifecycle state" })
  ).toBeVisible();

  const stateChange = page.waitForResponse(
    (response) =>
      response.url().includes("/api/relationships/") &&
      response.request().method() === "PATCH" &&
      response.ok()
  );
  await page.getByRole("combobox", { name: "Spouse lifecycle state" }).click();
  await page.getByRole("option", { name: "Divorced", exact: true }).click();
  await stateChange;
  await expect(
    page.getByRole("combobox", { name: "Spouse lifecycle state" })
  ).toContainText(/divorced/iu);

  await page.goto(`/people/${ann.id}`);
  await expect(
    page.getByText("Divorced", { exact: true }).first()
  ).toBeVisible();
});
