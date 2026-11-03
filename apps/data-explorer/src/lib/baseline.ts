import { type Dataset, dayToIso, minuteToTime } from "./dataset";
import type { Filters } from "./filters";
import type { QueryResult, Ranked } from "./query";

/**
 * The "before" side of the performance case study: the same query written the way most apps start,
 * over an array of row objects with filter/reduce/sort and string comparisons. It returns exactly
 * what runQuery returns (see baseline.test.ts), so the UI is identical and only speed differs.
 */
export type Row = {
  /** Index into the column arrays, so the table can render either result the same way. */
  i: number;
  date: string;
  time: string;
  station: string;
  line: string;
  code: string;
  bound: string;
  delay: number;
  gap: number;
};

export function toRows(ds: Dataset): Row[] {
  const { cols, dict } = ds;
  return Array.from({ length: ds.size }, (_, i) => ({
    i,
    date: dayToIso(cols.day[i]),
    time: minuteToTime(cols.minute[i]),
    station: dict.station[cols.station[i]],
    line: dict.line[cols.line[i]],
    code: dict.code[cols.code[i]],
    bound: dict.bound[cols.bound[i]],
    delay: cols.delay[i],
    gap: cols.gap[i],
  }));
}

const hourOf = (r: Row) => Number(r.time.slice(0, 2));
const stamp = (r: Row) => `${r.date} ${r.time}`;

function rank(rows: Row[], key: (r: Row) => string, limit: number): Ranked[] {
  const groups: Record<string, Ranked> = {};
  for (const r of rows) {
    const k = key(r);
    groups[k] ??= { key: k, minutes: 0, count: 0 };
    groups[k].minutes += r.delay;
    groups[k].count++;
  }
  return Object.values(groups)
    .sort((a, b) => b.minutes - a.minutes || b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit);
}

function compare(f: Filters): (a: Row, b: Row) => number {
  const sign = f.dir === "asc" ? 1 : -1;
  const primary = (a: Row, b: Row) => {
    switch (f.sort) {
      case "station":
      case "line":
      case "code":
        return a[f.sort].localeCompare(b[f.sort]);
      case "delay":
      case "gap":
        return a[f.sort] - b[f.sort];
      default:
        return stamp(a).localeCompare(stamp(b));
    }
  };
  // Same tie-breaks as runQuery: newest first, then original order.
  return (a, b) => sign * primary(a, b) || stamp(b).localeCompare(stamp(a)) || a.i - b.i;
}

export function runQueryNaive(rows: Row[], f: Filters, now: () => number = () => performance.now()): QueryResult {
  const start = now();
  const needle = f.station?.toLowerCase();
  const stationOk = (r: Row) => !needle || r.station.toLowerCase().includes(needle);
  const hourOk = (r: Row) => f.hour === null || hourOf(r) === f.hour;

  const base = rows.filter(
    (r) =>
      (!f.from || r.date >= f.from) &&
      (!f.to || r.date <= f.to) &&
      (!f.lines.length || f.lines.includes(r.line)) &&
      (!f.code || r.code === f.code) &&
      r.delay >= f.minDelay,
  );
  const matches = base.filter((r) => stationOk(r) && hourOk(r)).sort(compare(f));

  const byHour = new Array<number>(24).fill(0);
  base.filter(stationOk).forEach((r) => (byHour[hourOf(r)] += r.delay));

  const months: Record<number, number> = {};
  matches.forEach((r) => {
    const m = Number(r.date.slice(0, 4)) * 12 + Number(r.date.slice(5, 7)) - 1;
    months[m] = (months[m] ?? 0) + r.delay;
  });
  const keys = Object.keys(months).map(Number);
  const byMonth: QueryResult["byMonth"] = [];
  if (keys.length) for (let m = Math.min(...keys); m <= Math.max(...keys); m++) byMonth.push({ month: m, minutes: months[m] ?? 0 });

  const delays = matches.map((r) => r.delay).sort((a, b) => a - b);
  const quantile = (q: number) => (delays.length ? delays[Math.min(delays.length - 1, Math.floor(q * delays.length))] : 0);

  return {
    rows: Int32Array.from(matches, (r) => r.i),
    summary: {
      incidents: matches.length,
      totalDelay: delays.reduce((sum, d) => sum + d, 0),
      medianDelay: quantile(0.5),
      p90Delay: quantile(0.9),
    },
    byHour,
    byMonth,
    topStations: rank(base.filter(hourOk), (r) => r.station, 10),
    topCodes: rank(matches, (r) => r.code, 8),
    tookMs: now() - start,
  };
}
