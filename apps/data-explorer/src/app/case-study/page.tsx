import { Eyebrow } from "@repo/ui/eyebrow";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import results from "@/content/perf-results.json";
import { PERF_MODES, PERF_ORDER, type PerfMode } from "@/lib/perf-mode";

export const metadata: Metadata = {
  title: "Performance case study · TTC Delay Explorer",
  description: "How the TTC Delay Explorer went from a frozen tab to instant filtering over 48,000 incidents, with measurements for each step.",
};

const REPO = "https://github.com/yoonseo810/portfolio-projects/blob/main/apps/data-explorer";

type ModeResult = {
  load: { firstResultsMs: number; blockingMs: number; longestTaskMs: number; domNodes: number; heapMb: number };
  interactions: { name: string; ms: number; queryMs: number; blockingMs: number; longestTaskMs: number }[];
};
type Sizes = { rawKb: number; gzipKb: number; brotliKb: number; parseMs?: number };
type Results = {
  measuredAt: string;
  environment: { browser: string; runs: number; machine: string; statistic: string };
  /** Results per DevTools CPU slowdown factor ("1" = unthrottled). */
  byCpu: Record<string, Record<PerfMode, ModeResult>>;
  payload: { rows: number; csv: Sizes | null; rowObjects: Sizes; columnar: Sizes };
};
const r = results as unknown as Results;

const n = new Intl.NumberFormat("en-CA");
const ms = (v: number) => (v >= 1_000 ? `${(v / 1000).toFixed(1)} s` : `${n.format(v)} ms`);
const times = (a: number, b: number) => `${n.format(Math.round(a / b))}×`;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const link = "text-fg underline decoration-line-strong underline-offset-4";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight text-fg">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    // Focusable so keyboard users can scroll the table sideways on narrow screens.
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto rounded-xl border border-line focus-visible:outline-2 focus-visible:outline-accent"
    >
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-2 text-fg">
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={`px-3 py-2 font-medium ${i ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-t border-line">
              {cells.map((c, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="px-3 py-2 font-medium text-fg">
                    {c}
                  </th>
                ) : (
                  <td key={j} className="px-3 py-2 text-right tabular-nums">
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Code = ({ children }: { children: ReactNode }) => <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em] text-fg">{children}</code>;

export default function CaseStudy() {
  const fast = r.byCpu?.["1"];
  const slow = r.byCpu?.["4"];
  if (!fast || !slow) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-muted">No measurements yet. Run perf/measure.mjs with --cpu 1 and --cpu 4 to generate them.</p>
      </main>
    );
  }
  const { baseline: base, virtual: virt, columnar: col, shipped: ship } = fast;
  const env = r.environment;
  const p = r.payload;
  const interactionBlocking = (m: ModeResult) => sum(m.interactions.map((i) => i.blockingMs));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <Eyebrow>Performance case study</Eyebrow>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        <span className="text-gradient">From a frozen tab to instant filters</span>
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        The{" "}
        <Link href="/" className={link}>
          TTC Delay Explorer
        </Link>{" "}
        filters {n.format(p.rows)} subway delay incidents in the browser. A straightforward first version took{" "}
        <strong className="text-fg">{ms(base.load.firstResultsMs)}</strong> to show results, and {ms(slow.baseline.load.firstResultsMs)} on a CPU
        slowed down 4×. The shipped version takes <strong className="text-fg">{ms(ship.load.firstResultsMs)}</strong>. Here is what changed, what
        each change bought, and what didn&apos;t help as much as expected.
      </p>

      <Section title="Results">
        <p>
          Each row adds one optimization to the one above it. All four versions return identical results (a test checks this on the real data), so
          the only difference is how they get there. Measured without CPU throttling, on {env.machine}.
        </p>
        <Table
          caption="Page load by version"
          head={["Version", "Results on screen", "Main thread blocked", "Longest task", "DOM elements"]}
          rows={PERF_ORDER.map((m) => {
            const l = fast[m].load;
            return [PERF_MODES[m].label, ms(l.firstResultsMs), ms(l.blockingMs), ms(l.longestTaskMs), n.format(l.domNodes)];
          })}
        />
        <p>
          Then three interactions in a row, timed from the click until the new result is painted. &ldquo;Blocked&rdquo; is main-thread time beyond
          50 ms per task: the part that feels like a frozen page.
        </p>
        <Table
          caption="Interactions by version"
          head={["Version", ...base.interactions.map((i) => i.name)]}
          rows={PERF_ORDER.map((m) => [
            PERF_MODES[m].label,
            ...fast[m].interactions.map((i) => (
              <span key={i.name}>
                {ms(i.ms)}
                <span className="block text-xs text-muted">{ms(i.blockingMs)} blocked</span>
              </span>
            )),
          ])}
        />
        <p className="text-sm">
          Try each version yourself:{" "}
          {PERF_ORDER.map((m, i) => (
            <span key={m}>
              {i > 0 && " · "}
              <Link href={m === "shipped" ? "/" : `/?perf=${m}`} className={link}>
                {PERF_MODES[m].label.replace("+ ", "")}
              </Link>
            </span>
          ))}
          . The baseline will freeze your tab for a while.
        </p>
      </Section>

      <Section title="1. Render only the rows on screen">
        <p>
          The baseline put every incident in the DOM: {n.format(base.load.domNodes)} elements, in a single {ms(base.load.longestTaskMs)} task before
          the page could respond. A person sees about 20 rows at a time. With <Code>@tanstack/react-virtual</Code> the table renders only those plus a
          few above and below for smooth scrolling, and the page drops to {n.format(virt.load.domNodes)} elements. Results appear in{" "}
          {ms(virt.load.firstResultsMs)} instead of {ms(base.load.firstResultsMs)}, {times(base.load.firstResultsMs, virt.load.firstResultsMs)}{" "}
          faster. This one change was most of the win.
        </p>
        <p>
          The tradeoff is accessibility: a screen reader can&apos;t count rows that aren&apos;t in the DOM. The table uses ARIA table roles with{" "}
          <Code>aria-rowcount</Code> and <Code>aria-rowindex</Code>, so assistive tech still announces a row&apos;s real position, like &ldquo;row 1,204
          of 20,860&rdquo;. Find-in-page also only sees the visible rows, which is what the filters and station search are for.
        </p>
      </Section>

      <Section title="2. Query columns, not objects">
        <p>
          The baseline held each incident as an object with string fields and answered every filter with <Code>filter</Code>, <Code>reduce</Code> and{" "}
          <Code>localeCompare</Code>, making a separate pass for each chart. The shipped query stores each field as a typed array, keeps repeated
          strings like station names once in a dictionary, and computes the table, the stats and all four charts in one loop. Sorting by station
          compares precomputed integer ranks instead of strings.
        </p>
        <p>
          Load time went from {ms(virt.load.firstResultsMs)} to {ms(col.load.firstResultsMs)}, and main-thread blocking during load from{" "}
          {ms(virt.load.blockingMs)} to {ms(col.load.blockingMs)}, mostly because the page no longer builds {n.format(p.rows)} objects. The main-thread
          heap went from {virt.load.heapMb} MB to {col.load.heapMb} MB.
        </p>
        <p>
          It also shrinks the download. The same rows as a JSON array of objects are {n.format(p.rowObjects.rawKb)} KB ({n.format(p.rowObjects.brotliKb)}{" "}
          KB with Brotli) and take {p.rowObjects.parseMs} ms to parse in Node. The column file is {n.format(p.columnar.rawKb)} KB (
          {n.format(p.columnar.brotliKb)} KB with Brotli) and parses in {p.columnar.parseMs} ms. All four versions in the tables above download the
          column file, so those numbers leave this saving out.
        </p>
        <Table
          caption="Payload size"
          head={["Format", "Raw", "gzip", "Brotli", "Parse (Node)"]}
          rows={[
            ...(p.csv ? [["TTC CSV export", `${n.format(p.csv.rawKb)} KB`, `${n.format(p.csv.gzipKb)} KB`, `${n.format(p.csv.brotliKb)} KB`, "n/a"]] : []),
            ["JSON array of objects", `${n.format(p.rowObjects.rawKb)} KB`, `${n.format(p.rowObjects.gzipKb)} KB`, `${n.format(p.rowObjects.brotliKb)} KB`, `${p.rowObjects.parseMs} ms`],
            ["Column JSON (shipped)", `${n.format(p.columnar.rawKb)} KB`, `${n.format(p.columnar.gzipKb)} KB`, `${n.format(p.columnar.brotliKb)} KB`, `${p.columnar.parseMs} ms`],
          ]}
        />
      </Section>

      <Section title="3. Move the work off the main thread">
        <p>
          The shipped version fetches, parses and queries in a Web Worker. The main thread posts the filters and gets back the matching row indices as
          a transferred <Code>Int32Array</Code>, so nothing is copied. Each query is numbered, and answers to an older query are dropped, so typing
          quickly never shows results out of order.
        </p>
        <p>
          On this machine the worker didn&apos;t make anything faster: {ms(ship.load.firstResultsMs)} to first results against{" "}
          {ms(col.load.firstResultsMs)} without it, and the interactions are within noise. Once the column query takes tens of milliseconds, a fast
          CPU has little left to free up, and the worker adds a message hop.
        </p>
        <p>
          It pays off when the main thread is slow. With the CPU slowed down 4×, the version without a worker blocked the main thread for{" "}
          {ms(slow.columnar.load.blockingMs)} during load and {ms(interactionBlocking(slow.columnar))} across the three interactions. With the
          worker, that dropped to {ms(slow.shipped.load.blockingMs)} and {ms(interactionBlocking(slow.shipped))}. What remains is React rendering
          the charts and table, which is the next thing to work on.
        </p>
        <Table
          caption="Main-thread blocking with the CPU slowed down 4 times"
          head={["Version (CPU 4× slower)", "Blocked during load", "Blocked across interactions", "Longest task"]}
          rows={PERF_ORDER.map((m) => [
            PERF_MODES[m].label,
            ms(slow[m].load.blockingMs),
            ms(interactionBlocking(slow[m])),
            ms(Math.max(slow[m].load.longestTaskMs, ...slow[m].interactions.map((i) => i.longestTaskMs))),
          ])}
        />
        <p className="text-sm">
          Chrome&apos;s CPU throttling slows the page&apos;s main thread but not Web Workers, so this table compares only main-thread blocking, which
          is fair across all four. Time to results with throttling isn&apos;t comparable for the worker version, so it&apos;s left out.
        </p>
      </Section>

      <Section title="How this was measured">
        <p>
          <a href={`${REPO}/perf/measure.mjs`} className={link}>
            perf/measure.mjs
          </a>{" "}
          drives {env.browser} with Playwright against a production build, with a cold cache for every run. Each version ran {env.runs} times per
          CPU setting and the tables show the {env.statistic}. Measured {r.measuredAt}.
        </p>
        <p>
          &ldquo;Results on screen&rdquo; is the first frame after the result count appears. Blocking time and the longest task come from the
          browser&apos;s Long Tasks API. Heap is the page&apos;s main thread only; in the shipped version the dataset lives in the worker.
        </p>
        <p>
          Limits: this is headless Chromium on a cloud machine, not a real phone, and three runs is a small sample. Trust the ratios more than the
          exact milliseconds. The page renders these numbers from the JSON file the script writes, so rerunning it updates this page.
        </p>
      </Section>
    </main>
  );
}
