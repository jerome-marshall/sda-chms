/* oxlint-disable vitest/prefer-importing-vitest-globals -- Playwright spec: test/expect come from @playwright/test, not Vitest */
import { expect, test } from "@playwright/test";

const suffix = Date.now();

test("a member shows the Head's shared phone and follows an edit", async ({
  page,
  request,
}) => {
  const headResponse = await request.post("/api/people", {
    data: {
      firstName: "Hana",
      lastName: `Shared ${suffix}`,
      gender: "female",
      dateOfBirth: "1980-01-01",
      phone: "9000000000",
      addressLine1: "1 Shared Street",
      city: "Hosur",
      state: "Tamil Nadu",
      country: "India",
      maritalStatus: "single",
      membershipStatus: "member",
      dietaryPreference: "none",
      householdRole: "head",
    },
  });
  expect(headResponse.ok()).toBeTruthy();
  const head = (await headResponse.json()) as {
    householdId: string;
    id: string;
  };

  const memberResponse = await request.post("/api/people", {
    data: {
      firstName: "Mia",
      lastName: `Shared ${suffix}`,
      gender: "female",
      dateOfBirth: "2010-01-01",
      householdId: head.householdId,
      householdRole: "child",
      maritalStatus: "single",
      membershipStatus: "member",
      dietaryPreference: "none",
    },
  });
  expect(memberResponse.ok()).toBeTruthy();
  const member = (await memberResponse.json()) as { id: string };

  await page.goto(`/people/${member.id}`);
  const phoneChip = page.getByRole("link", { name: "9000000000" }).first();
  await expect(phoneChip).toBeVisible();
  await expect(phoneChip.locator("svg.lucide-house")).toHaveCount(1);

  await page.goto(`/people/${head.id}/edit`);
  await expect(page.getByRole("textbox", { name: "Phone" })).toBeEnabled();
  await page.getByRole("textbox", { name: "Phone" }).fill("9111111111");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page).toHaveURL(`/people/${head.id}`);

  await page.goto(`/people/${member.id}`);
  await expect(
    page.getByText("9111111111", { exact: true }).first()
  ).toBeVisible();
  await expect(page.getByText("9000000000", { exact: true })).toHaveCount(0);
});
