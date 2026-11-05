import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./axe";

const BASE = "http://localhost:3003/explorer";

/** The "Incidents" stat card's number, e.g. 54,123 → 54123. */
async function incidents(page: import("@playwright/test").Page) {
  const card = page.getByText("Incidents", { exact: true }).locator("..");
  const text = await card.locator("p").nth(1).innerText();
  return Number(text.replace(/[^\d]/g, ""));
}

test("filters update the results and the URL, and a shared URL restores the view", async ({ page }) => {
  await page.goto(BASE);
  const table = page.getByRole("table", { name: "Delay incidents" });
  await expect(table).toBeVisible();
  const all = await incidents(page);
  expect(all).toBeGreaterThan(1000);

  // Filter to one line: fewer incidents, and the filter lands in the URL.
  await page.getByRole("group", { name: "Line", exact: true }).getByRole("button").first().click();
  await expect(page).toHaveURL(/[?&]line=/);
  await expect.poll(() => incidents(page)).toBeLessThan(all);
  const filtered = await incidents(page);

  // Opening the same URL in a fresh page shows the same view.
  const shared = page.url();
  const other = await page.context().newPage();
  await other.goto(shared);
  await expect.poll(() => incidents(other)).toBe(filtered);
  await expect(other.getByRole("button", { pressed: true }).first()).toBeVisible();
});

test("the virtualized table renders only rows in view", async ({ page }) => {
  await page.goto(BASE);
  const table = page.getByRole("table", { name: "Delay incidents" });
  await expect(table.getByRole("row").nth(2)).toBeVisible();
  const total = Number(await table.getAttribute("aria-rowcount"));
  const rendered = await table.getByRole("row").count();
  expect(total).toBeGreaterThan(1000);
  expect(rendered).toBeLessThan(100);
});

test("malformed URL params are ignored instead of breaking the page", async ({ page }) => {
  await page.goto(`${BASE}?from=not-a-date&hour=99&sort=nope`);
  await expect(page.getByRole("table", { name: "Delay incidents" })).toBeVisible();
});

test("explorer has no accessibility violations", async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByRole("table", { name: "Delay incidents" })).toBeVisible();
  // The hour chart's bars are narrow; the "Hour of day" select is the full-size equivalent.
  await expectNoA11yViolations(page, { smallTargets: ['[aria-label="Filter by hour of day"]'] });
});

test("the hour select and the hour chart set the same filter", async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole("combobox", { name: "Hour of day" }).selectOption("8");
  await expect(page).toHaveURL(/[?&]hour=8\b/);
  await expect(page.getByRole("button", { name: /^08:00,/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^08:00,/ }).click();
  await expect(page.getByRole("combobox", { name: "Hour of day" })).toHaveValue("");
});
