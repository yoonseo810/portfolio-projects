import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const report = (violations: { id: string; nodes: { target: unknown[] }[] }[]) =>
  violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);

/**
 * Fails the test on any WCAG 2.2 A/AA violation in the current page state.
 * `smallTargets` names regions whose controls are allowed under 24px because the page offers an
 * equivalent full-size control (WCAG 2.5.8 "Equivalent" exception); every other rule still runs there.
 */
export async function expectNoA11yViolations(page: Page, { smallTargets = [] }: { smallTargets?: string[] } = {}) {
  const page_ = new AxeBuilder({ page }).withTags(TAGS);
  for (const s of smallTargets) page_.exclude(s);
  expect(report((await page_.analyze()).violations)).toEqual([]);

  for (const s of smallTargets) {
    const region = await new AxeBuilder({ page }).withTags(TAGS).include(s).disableRules(["target-size"]).analyze();
    expect(report(region.violations)).toEqual([]);
  }
}
