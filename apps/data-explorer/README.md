# TTC Delay Explorer

Filter and chart every reported TTC subway delay by date, line, station, cause and hour.

**Live:** https://portfolio-projects-wine.vercel.app/explorer (a zone under the portfolio domain)

**Performance case study:** https://portfolio-projects-wine.vercel.app/explorer/case-study

## How it works

- **Data.** `scripts/build-data.mjs` turns the City of Toronto's CSV exports into a compact column format: repeated strings go into dictionaries, and each field is its own array. That's `public/data/subway-delays.json`, about 1.3 MB raw or 280 KB gzipped for ~54k rows. It ships as a static file, cached for a day.
- **Web Worker.** `src/workers/query.worker.ts` fetches and decodes the data into typed arrays, then answers every query in one pass (`src/lib/query.ts`). That pass produces:
  - the matching rows, sorted
  - summary stats (count, total, median, p90)
  - delay minutes by month and by hour
  - the top stations and causes

  Typing never blocks scrolling, and answers to stale queries are dropped.
- **Cross-filtering.**
  - Clicking an hour, station or cause filters everything else.
  - Each chart ignores its own filter, so you can still compare.
  - While a newer query runs, results stay on screen, dimmed.
- **URL state.**
  - Every filter and the sort order live in the query string (`src/lib/filters.ts`), so any view can be shared.
  - Malformed params are dropped, never thrown.
- **Virtualized table.** TanStack Virtual renders only the rows in view. ARIA table roles with `aria-rowcount` and `aria-rowindex` keep the real size available to screen readers.
- **Accessible charts.**
  - Bars are toggle buttons with labels.
  - The line chart has a keyboard crosshair (arrow keys).
  - Every chart has a "Show as table" fallback.

## Data

- Source: [City of Toronto Open Data, TTC Subway Delay Data](https://open.toronto.ca/dataset/ttc-subway-delay-data/).
- Licence: [Open Government Licence – Toronto](https://open.toronto.ca/open-data-license/).

To refresh the data:

```bash
# Put the CSV exports (and the delay-codes CSV, if you have it) in data/raw/, then:
pnpm --filter data-explorer data
# Or generate the labelled synthetic sample:
pnpm --filter data-explorer data:sample
```

## Develop

```bash
pnpm --filter data-explorer dev   # http://localhost:3003/explorer, or via the portfolio at http://localhost:3000/explorer
pnpm --filter data-explorer test
```

## Performance case study

`/case-study` compares four cumulative versions of the app (baseline, + virtualized table, + columnar query, + Web Worker). Open any version with `?perf=baseline|virtual|columnar|shipped`. To re-measure, run a production build on port 3003 and then:

```bash
pnpm --filter data-explorer perf -- --cpu 1   # and --cpu 4; writes src/content/perf-results.json
```
