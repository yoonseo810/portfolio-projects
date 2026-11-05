import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, expect, test } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import desktop from "lighthouse/core/config/desktop-config.js";

/**
 * Lighthouse budgets (desktop preset). CI fails when a page drops below these scores (0–1), ships
 * more JavaScript than its budget, or fails any accessibility audit it isn't explicitly allowed.
 * Script budgets are about 15% over what each page measured on 2026-11-05 (135, 161 and 160 KB).
 * Reports are saved in lighthouse-report/.
 */
const PAGES = [
  { name: "portfolio", url: "http://localhost:3000/", scriptKb: 160, allowA11y: [] },
  // The hour chart's bars are narrow; the "Hour of day" select is the full-size equivalent (WCAG 2.5.8).
  { name: "explorer", url: "http://localhost:3003/explorer", scriptKb: 190, allowA11y: ["target-size"] },
  { name: "kiosk", url: "http://localhost:3004/kiosk", scriptKb: 190, allowA11y: [] },
];
const MIN_SCORES = { performance: 0.9, "best-practices": 0.9, seo: 0.9 };

test.describe.configure({ mode: "serial" });

for (const p of PAGES) {
  test(`${p.name} stays within its Lighthouse budget`, async () => {
    test.setTimeout(120_000);
    const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless=new", "--no-sandbox"] });
    try {
      const result = await lighthouse(p.url, { port: chrome.port, output: "html", logLevel: "error" }, desktop);
      if (!result) throw new Error("Lighthouse returned no result");
      mkdirSync("lighthouse-report", { recursive: true });
      writeFileSync(`lighthouse-report/${p.name}.html`, result.report as string);

      const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([k, c]) => [k, c.score ?? 0]));
      const items = (result.lhr.audits["resource-summary"].details as unknown as { items: { resourceType: string; transferSize: number }[] }).items;
      const scriptKb = Math.round((items.find((i) => i.resourceType === "script")?.transferSize ?? 0) / 1024);
      console.log(p.name, JSON.stringify({ ...scores, scriptKb, lcpMs: Math.round(result.lhr.audits["largest-contentful-paint"].numericValue ?? 0), cls: result.lhr.audits["cumulative-layout-shift"].numericValue }));

      for (const [k, min] of Object.entries(MIN_SCORES)) expect(scores[k], `${k} score`).toBeGreaterThanOrEqual(min);
      expect(scriptKb, "JavaScript KB transferred").toBeLessThanOrEqual(p.scriptKb);
      const failing = result.lhr.categories.accessibility.auditRefs
        .filter((r) => r.weight > 0 && result.lhr.audits[r.id].score !== null && result.lhr.audits[r.id].score! < 1)
        .map((r) => r.id)
        .filter((id) => !(p.allowA11y as string[]).includes(id));
      expect(failing, "failing accessibility audits").toEqual([]);
    } finally {
      chrome.kill();
    }
  });
}
