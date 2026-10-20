/* oxlint-disable vitest/prefer-importing-vitest-globals -- Playwright spec: test/expect come from @playwright/test, not Vitest */
import { expect, test } from "@playwright/test";

test("the People directory page loads and lists seeded people", async ({
  page,
}) => {
  await page.goto("/people");

  await expect(
    page.getByRole("heading", { name: "People Directory" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Add Person" })).toBeVisible();

  // The data-grid toolbar only renders once the people query resolves (it is
  // absent during the loading skeleton and the error state), so this proves the
  // request to the API + DB succeeded rather than just that the static chrome
  // mounted.
  await expect(page.getByRole("toolbar")).toBeVisible();
  await expect(page.getByText("Error loading people")).toHaveCount(0);

  // And the seeded data must actually render: each person row links to its
  // detail page (`/people/<id>`), distinct from the static "Add Person" link.
  const personRowLinks = page
    .locator('a[href^="/people/"]')
    .filter({ hasNotText: "Add Person" });
  await expect(personRowLinks.first()).toBeVisible();
});

test("a direct load of a person page returns server-rendered HTML with the person name", async ({
  page,
  request,
}) => {
  const peopleRes = await request.get("/api/people");
  expect(peopleRes.ok()).toBeTruthy();
  const people = (await peopleRes.json()) as {
    id: string;
    fullName: string;
  }[];
  const first = people[0];
  if (!first) {
    throw new Error("e2e/people: expected at least one seeded person");
  }

  // Raw HTML without executing JavaScript: the name must already be in the
  // document, which proves the loader server-rendered it.
  const directRes = await request.get(`/people/${first.id}`);
  expect(directRes.ok()).toBeTruthy();
  await expect(directRes.text()).resolves.toContain(first.fullName);

  await page.goto(`/people/${first.id}`);
  await expect(
    page.getByRole("heading", { name: first.fullName }).first()
  ).toBeVisible();
});

test("the add form redirects to the new person detail page", async ({
  page,
}) => {
  const lastName = `Pages ${Date.now()}`;

  await page.goto("/people/add");
  // Fills before hydration completes are wiped when React takes over the
  // server-rendered inputs, so wait for the client to settle first.
  await page.waitForLoadState("networkidle");
  const firstName = page.getByRole("textbox", { name: "First name" });
  await firstName.fill("E2E");
  await expect(firstName).toHaveValue("E2E");
  await page.getByRole("textbox", { name: "Last name" }).fill(lastName);
  await page.getByRole("combobox", { name: "Gender" }).click();
  await page.getByRole("option", { name: "Male", exact: true }).click();
  await page.getByRole("button", { name: "Date of birth" }).click();
  await page
    .getByRole("combobox", { name: "Choose the Year" })
    .selectOption("1990");
  await page
    .getByRole("combobox", { name: "Choose the Month" })
    .selectOption("0");
  await page.getByRole("button", { name: /January 15th, 1990/u }).click();
  await page.getByRole("combobox", { name: "Household role" }).click();
  await page.getByRole("option", { name: "Head", exact: true }).click();

  await page.getByRole("button", { name: "Add Person" }).click();

  await expect(page).toHaveURL(/\/people\/[0-9a-f-]{36}/u);
  await expect(
    page.getByRole("heading", { name: `E2E ${lastName}` }).first()
  ).toBeVisible();
  await expect(page.getByText("Person added successfully")).toBeVisible();
});
