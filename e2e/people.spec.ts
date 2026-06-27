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
