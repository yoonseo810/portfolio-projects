import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./axe";

test("portfolio lists every live project and links to it", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const projects = page.getByRole("region", { name: "Projects" });
  for (const name of ["Kiosk Check-in", "TTC Delay Explorer", "Design System"]) {
    await expect(projects.getByRole("heading", { name })).toBeVisible();
  }
  await expect(projects.locator('a[href="/kiosk"]').first()).toBeVisible();
  await expect(projects.locator('a[href="/explorer"]').first()).toBeVisible();
  await expectNoA11yViolations(page);
});
