import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./axe";

const KIOSK = "http://localhost:3004/kiosk";

/** A staff panel counter, e.g. "Synced". */
const stat = (page: Page, term: string) => page.locator("dt", { hasText: term }).locator("xpath=following-sibling::dd[1]");

/** Runs the whole check-in for a sample booking, accepting the suggested seats and bags. */
async function checkIn(page: Page, code: string) {
  await page.getByRole("button", { name: "Start check-in" }).click();
  await page.getByRole("button", { name: new RegExp(code) }).click();
  const confirm = page.getByRole("button", { name: "Confirm check-in" });
  const next = page.getByRole("button", { name: "Continue" });
  // Travellers (skipped for one person), seats, bags, then review.
  while (!(await confirm.isVisible())) {
    await expect(next).toBeEnabled();
    await next.click();
  }
  await confirm.click();
  await expect(page.getByRole("heading", { name: "You're checked in" })).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
}

/** Waits until the service worker controls the page, then reloads once so the app's scripts are cached too. */
async function installOffline(page: Page) {
  await page.goto(KIOSK);
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller);
  await page.reload();
  await expect(page.getByRole("button", { name: "Start check-in" })).toBeVisible();
}

test("checks in a family online and syncs the check-in", async ({ page }) => {
  await page.goto(KIOSK);
  await checkIn(page, "K7Q2TR");
  await expect(stat(page, "Synced")).toHaveText("1");
  await expect(stat(page, "Waiting to send")).toHaveText("0");
});

test("keeps working with no network and sends the queued check-in when it returns", async ({ page, context }) => {
  await installOffline(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("status").filter({ hasText: "Offline" }).first()).toBeVisible();

  await checkIn(page, "N4VX8P");
  await expect(stat(page, "Waiting to send")).toHaveText("1");

  // The queue lives in IndexedDB, so it survives a reload while still offline.
  await page.reload();
  await expect(stat(page, "Waiting to send")).toHaveText("1");

  await context.setOffline(false);
  await expect(stat(page, "Synced")).toHaveText("1", { timeout: 20_000 });
  await expect(stat(page, "Waiting to send")).toHaveText("0");
});

test("two offline kiosks that give out the same seat: the first to sync keeps it", async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  for (const p of [a, b]) {
    await p.goto(KIOSK);
    await p.getByRole("switch", { name: "Simulate offline" }).click();
  }
  await checkIn(a, "K7Q2TR");
  await checkIn(b, "P5MX2C");

  await a.getByRole("switch", { name: "Simulate offline" }).click();
  await expect(stat(a, "Synced")).toHaveText("1");
  await b.getByRole("switch", { name: "Simulate offline" }).click();
  await expect(stat(b, "Needs an agent")).toHaveText("1");
  await expect(b.getByText(/went to another kiosk first/).first()).toBeVisible();
});

test("kiosk screens have no accessibility violations", async ({ page }) => {
  await page.goto(KIOSK);
  await expectNoA11yViolations(page);
  await page.getByRole("button", { name: "Start check-in" }).click();
  await page.getByRole("button", { name: /K7Q2TR/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("grid", { name: /Economy/ })).toBeVisible();
  await expectNoA11yViolations(page);
});
