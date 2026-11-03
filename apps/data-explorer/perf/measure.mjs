#!/usr/bin/env node
/**
 * Measures each benchmark mode (src/lib/perf-mode.ts) in a real browser and writes
 * src/content/perf-results.json, which the case study page renders. Nothing on that page is typed in
 * by hand: rerun this to refresh it.
 *
 *   pnpm build && pnpm start          # in another terminal
 *   node perf/measure.mjs [--url http://localhost:3003/explorer] [--runs 3] [--cpu 4] [--modes baseline,virtual,columnar,shipped]
 *
 * Each run uses a fresh browser context (cold cache). `--cpu N` slows the page's main thread N times
 * through the Chrome DevTools Protocol to approximate a slower phone. DevTools can't throttle Web
 * Workers, so throttled numbers for the "shipped" mode aren't comparable to the others; the case
 * study compares all four modes unthrottled (--cpu 1) and uses throttled runs only for the
 * main-thread modes. Results for each --cpu value are kept side by side in the output file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { payloadSizes } from "./offline.mjs";


const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const URL_BASE = arg("url", "http://localhost:3003/explorer");
const RUNS = Number(arg("runs", 3));
const CPU = Number(arg("cpu", 4));
const MODES = arg("modes", "baseline,virtual,columnar,shipped").split(",");

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round = (x) => Math.round(x);

// Runs in the page before any app code: records long tasks and when results first appear.
const probe = () => {
  window.__perf = { longTasks: [], firstResults: null };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__perf.longTasks.push({ start: e.startTime, duration: e.duration });
  }).observe({ type: "longtask", buffered: true });
  const check = () => {
    const el = document.querySelector('p[role="status"]');
    if (el && /incidents match/.test(el.textContent) && window.__perf.firstResults === null) {
      // The next frame is when the user can see them.
      requestAnimationFrame(() => (window.__perf.firstResults = performance.now()));
      return true;
    }
    return false;
  };
  new MutationObserver((_, obs) => check() && obs.disconnect()).observe(document, { childList: true, subtree: true, characterData: true });
};

/** Clicks `selector`, then resolves with ms until the new result is on screen and a frame has painted. */
const interact = ({ selector, text }) =>
  new Promise((resolve, reject) => {
    const results = document.querySelector("[data-result-key]");
    const before = results.getAttribute("data-result-key");
    const button = [...document.querySelectorAll(selector)].find((b) => (text ? b.textContent.trim().startsWith(text) : true));
    if (!button) return reject(new Error(`No button for ${selector} ${text ?? ""}`));
    const tasksBefore = window.__perf.longTasks.length;
    const t0 = performance.now();
    const done = () => {
      requestAnimationFrame(() => {
        const ms = performance.now() - t0;
        // Give long-task entries a moment to be delivered before counting them.
        setTimeout(() => {
          const tasks = window.__perf.longTasks.slice(tasksBefore);
          const badge = /Filtered in (<?\d+) ms/.exec(document.querySelector('p[role="status"]')?.textContent ?? "");
          resolve({ ms, queryMs: badge ? Number(badge[1].replace("<", "0.5")) : null, blocking: tasks.reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0), longest: Math.max(0, ...tasks.map((t) => t.duration)) });
        }, 300);
      });
    };
    const obs = new MutationObserver(() => {
      if (results.getAttribute("data-result-key") !== before && results.getAttribute("aria-busy") !== "true") {
        obs.disconnect();
        done();
      }
    });
    obs.observe(results, { attributes: true, attributeFilter: ["aria-busy", "data-result-key"] });
    button.click();
  });

const INTERACTIONS = [
  { name: "Filter to Line 2", selector: "fieldset button", text: "Line 2" },
  { name: "Pick 08:00 on the hour chart", selector: 'button[aria-label^="08:00"]' },
  { name: "Sort by delay", selector: '[role="columnheader"] button', text: "Delay" },
];

async function measure(browser, mode) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  await cdp.send("Performance.enable");
  await page.addInitScript(probe);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(`${URL_BASE}${mode === "shipped" ? "" : `?perf=${mode}`}`, { waitUntil: "commit" });
  await page.waitForFunction(() => window.__perf?.firstResults !== null, null, { timeout: 900_000 });
  await page.waitForTimeout(500);
  const load = await page.evaluate(() => {
    const t = window.__perf.firstResults;
    const tasks = window.__perf.longTasks.filter((x) => x.start < t);
    return {
      firstResultsMs: t,
      blockingMs: tasks.reduce((sum, x) => sum + Math.max(0, x.duration - 50), 0),
      longestTaskMs: Math.max(0, ...tasks.map((x) => x.duration)),
      domNodes: document.getElementsByTagName("*").length,
    };
  });
  const { metrics } = await cdp.send("Performance.getMetrics");
  load.heapMb = metrics.find((m) => m.name === "JSHeapUsedSize").value / 1024 / 1024;

  const interactions = [];
  for (const step of INTERACTIONS) {
    interactions.push({ name: step.name, ...(await page.evaluate(interact, { selector: step.selector, text: step.text }).catch((e) => { throw new Error(`${mode}: ${step.name}: ${e.message}`); })) });
    await page.waitForTimeout(300);
  }
  await context.close();
  if (errors.length) throw new Error(`${mode}: page errors: ${errors.join("; ")}`);
  return { load, interactions };
}

const browser = await chromium.launch();
const results = {};
for (const mode of MODES) {
  const runs = [];
  for (let r = 0; r < RUNS; r++) {
    runs.push(await measure(browser, mode));
    process.stdout.write(".");
  }
  const pick = (f) => median(runs.map(f));
  results[mode] = {
    load: {
      firstResultsMs: round(pick((r) => r.load.firstResultsMs)),
      blockingMs: round(pick((r) => r.load.blockingMs)),
      longestTaskMs: round(pick((r) => r.load.longestTaskMs)),
      domNodes: round(pick((r) => r.load.domNodes)),
      heapMb: Math.round(pick((r) => r.load.heapMb) * 10) / 10,
    },
    interactions: INTERACTIONS.map((step, k) => ({
      name: step.name,
      ms: round(pick((r) => r.interactions[k].ms)),
      queryMs: round(pick((r) => r.interactions[k].queryMs)),
      blockingMs: round(pick((r) => r.interactions[k].blocking)),
      longestTaskMs: round(pick((r) => r.interactions[k].longest)),
    })),
  };
  console.log(` ${mode}`, JSON.stringify(results[mode]));
}
const version = browser.version();
await browser.close();

const file = join(root, "src/content/perf-results.json");
let previous = {};
try {
  previous = JSON.parse(readFileSync(file, "utf8"));
} catch {}
const out = {
  measuredAt: new Date().toISOString().slice(0, 10),
  environment: { browser: `Chromium ${version} (headless)`, runs: RUNS, machine: `${cpus().length} × ${cpus()[0].model.trim()}`, statistic: "median" },
  byCpu: { ...previous.byCpu, [CPU]: { ...previous.byCpu?.[CPU], ...results } },
  ...payloadSizes(),
};
writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote ${file}`);
